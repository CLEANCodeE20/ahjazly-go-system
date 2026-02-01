-- ==========================================================
-- THE ULTIMATE IDENTITY CONVERGENCE (GOLD STANDARD - THE FINAL PURGE)
-- Date: 2026-01-31
-- Purpose: 1. Dynamically purge ALL triggers and views blocking identity schema changes.
--          2. Sanitize and modernize ALL identity columns (BigInt -> UUID).
--          3. Restore a robust, consolidated identity engine.
-- ==========================================================

BEGIN;

-- 1. STAGE ONE: DYNAMIC PURGE (Clear every lock)
-- ==========================================================
DROP VIEW IF EXISTS public.vw_user_redirection CASCADE;

DO $$ 
DECLARE
    trg RECORD;
    pol RECORD;
    tbl TEXT;
    target_tables TEXT[] := ARRAY['user_roles', 'wallets', 'employees', 'drivers', 'users', 'user_two_factor', 'documents', 'user_device_tokens', 'ratings', 'bookings', 'booking_approvals'];
BEGIN
    -- 1. Purge ALL triggers on auth.users
    FOR trg IN SELECT trigger_name FROM information_schema.triggers WHERE event_object_schema = 'auth' AND event_object_table = 'users'
    LOOP EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users', trg.trigger_name); END LOOP;
    
    -- 2. Purge ALL triggers and policies on target public tables
    FOREACH tbl IN ARRAY target_tables LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
            -- Triggers
            FOR trg IN SELECT trigger_name FROM information_schema.triggers WHERE event_object_schema = 'public' AND event_object_table = tbl
            LOOP EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I CASCADE', trg.trigger_name, tbl); END LOOP;
            
            -- Policies (Broad cleanup)
            FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = tbl
            LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl); END LOOP;
        END IF;
    END LOOP;

    -- 3. Cleanup special policy tables
    FOREACH tbl IN ARRAY ARRAY['branches', 'ui_site_settings', 'partners', 'trips', 'driver_settings'] LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
            FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = tbl
            LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl); END LOOP;
        END IF;
    END LOOP;
END $$;

-- 2. STAGE TWO: IDENTITY HUB STABILIZATION (users table)
-- ==========================================================
DO $$ 
BEGIN
    -- Ensure clean unique constraints
    DELETE FROM public.users r1 USING public.users r2 WHERE r1.auth_id = r2.auth_id AND r1.user_id < r2.user_id;
    DELETE FROM public.users r1 USING public.users r2 WHERE r1.email = r2.email AND r1.user_id < r2.user_id;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_auth_id_unique') THEN
        ALTER TABLE public.users ADD CONSTRAINT users_auth_id_unique UNIQUE (auth_id);
    END IF;
END $$;

-- 3. STAGE THREE: THE MODERNIZATION WAVE (BigInt -> UUID via Mapping)
-- ==========================================================

-- Helper Logic for each table: Rename old column, add new UUID column, map from users table, drop old.
DO $$ 
DECLARE
    tbl TEXT;
    target_tables TEXT[] := ARRAY['wallets', 'employees', 'drivers', 'user_roles', 'user_device_tokens', 'documents', 'ratings', 'bookings', 'booking_approvals'];
BEGIN
    FOREACH tbl IN ARRAY target_tables LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = tbl) THEN
            -- Handle legacy 'user_id' column
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = tbl AND column_name = 'user_id') THEN
                -- Check if it's already UUID or needs mapping
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = tbl AND column_name = 'user_id' AND data_type = 'uuid') THEN
                    EXECUTE format('ALTER TABLE public.%I RENAME COLUMN user_id TO auth_id', tbl);
                ELSE
                    EXECUTE format('ALTER TABLE public.%I RENAME COLUMN user_id TO old_user_id', tbl);
                END IF;
            END IF;

            -- Standard transformation for tables with 'old_user_id'
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = tbl AND column_name = 'old_user_id') THEN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = tbl AND column_name = 'auth_id') THEN
                    EXECUTE format('ALTER TABLE public.%I ADD COLUMN auth_id UUID', tbl);
                END IF;
                -- Map from users hub
                EXECUTE format('UPDATE public.%I t SET auth_id = u.auth_id FROM public.users u WHERE t.old_user_id = u.user_id AND t.auth_id IS NULL', tbl);
                -- Cleanup
                EXECUTE format('ALTER TABLE public.%I DROP COLUMN IF EXISTS old_user_id CASCADE', tbl);
            END IF;
            
            -- Ensure auth_id exists and is NOT NULL where critical
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = tbl AND column_name = 'auth_id') THEN
                IF tbl IN ('wallets', 'user_roles') THEN
                    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN auth_id SET NOT NULL', tbl);
                END IF;
            END IF;
        END IF;
    END LOOP;
END $$;

-- 3.6 STAGE THREE POINT SIX: PARTNER HUB NORMALIZATION
-- ==========================================================
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'partners') THEN
        -- Add missing professional fields
        ALTER TABLE public.partners 
            ADD COLUMN IF NOT EXISTS commercial_registration VARCHAR(100) UNIQUE,
            ADD COLUMN IF NOT EXISTS tax_number VARCHAR(100) UNIQUE,
            ADD COLUMN IF NOT EXISTS website TEXT,
            ADD COLUMN IF NOT EXISTS bank_name VARCHAR(255),
            ADD COLUMN IF NOT EXISTS iban VARCHAR(50),
            ADD COLUMN IF NOT EXISTS account_number VARCHAR(50),
            ADD COLUMN IF NOT EXISTS swift_code VARCHAR(50),
            ADD COLUMN IF NOT EXISTS commercial_register_url TEXT,
            ADD COLUMN IF NOT EXISTS tax_certificate_url TEXT,
            ADD COLUMN IF NOT EXISTS manager_auth_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

        -- Create FK to public.users for PostgREST
        ALTER TABLE public.partners DROP CONSTRAINT IF EXISTS partners_manager_auth_public_fkey;
        ALTER TABLE public.partners ADD CONSTRAINT partners_manager_auth_public_fkey 
            FOREIGN KEY (manager_auth_id) REFERENCES public.users(auth_id) ON DELETE SET NULL;

        -- Backfill: Link partner to their first PARTNER_ADMIN if exists
        UPDATE public.partners p
        SET manager_auth_id = ur.auth_id
        FROM public.user_roles ur
        WHERE ur.partner_id = p.partner_id 
        AND ur.role = 'PARTNER_ADMIN'
        AND p.manager_auth_id IS NULL;

        -- Migrating existing documents to the centralized table
        -- Commercial Register
        INSERT INTO public.documents (partner_id, auth_id, document_type, document_url, verification_status)
        SELECT partner_id, manager_auth_id, 'registration'::public.document_type, commercial_register_url, 'approved'::public.verification_status
        FROM public.partners
        WHERE commercial_register_url IS NOT NULL
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- 3.5 STAGE THREE POINT FIVE: DATA INTEGRITY (FK Constraints)
-- ==========================================================
DO $$ 
DECLARE
    tbl TEXT;
    target_tables TEXT[] := ARRAY['wallets', 'employees', 'drivers', 'user_roles', 'user_device_tokens', 'documents', 'ratings', 'bookings', 'booking_approvals'];
BEGIN
    FOREACH tbl IN ARRAY target_tables LOOP
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = tbl AND column_name = 'auth_id') THEN
            -- 1. FK to auth.users (Internal Postgres/Supabase link)
            EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I_auth_id_fkey', tbl, tbl);
            EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I_auth_id_fkey FOREIGN KEY (auth_id) REFERENCES auth.users(id) ON DELETE CASCADE', tbl, tbl);
            
            -- 2. FK to public.users (Crucial for PostgREST relationship detection)
            EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I_auth_id_public_fkey', tbl, tbl);
            EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I_auth_id_public_fkey FOREIGN KEY (auth_id) REFERENCES public.users(auth_id) ON DELETE CASCADE', tbl, tbl);
        END IF;
    END LOOP;
END $$;

-- 3.7 STAGE THREE POINT SEVEN: DRIVER SPECIALIZATION
-- ==========================================================
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'drivers') THEN
        ALTER TABLE public.drivers 
            ADD COLUMN IF NOT EXISTS employment_type VARCHAR(20) DEFAULT 'full_time' CHECK (employment_type IN ('full_time', 'part_time', 'contractor')),
            ADD COLUMN IF NOT EXISTS hire_date DATE,
            ADD COLUMN IF NOT EXISTS termination_date DATE,
            ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255),
            ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20),
            ADD COLUMN IF NOT EXISTS blood_type VARCHAR(5),
            ADD COLUMN IF NOT EXISTS notes TEXT;
    END IF;
END $$;

-- 4. STAGE FOUR: ENGINE REBUILD (The Universal Identity Trigger)
-- ==========================================================

CREATE OR REPLACE FUNCTION public.handle_universal_identity() 
RETURNS TRIGGER AS $$
DECLARE
    v_role_str TEXT;
    v_partner_id BIGINT;
BEGIN
    -- 1. Determine Identity Role & Partner
    v_partner_id := (new.raw_user_meta_data->>'partner_id')::BIGINT;
    
    IF (new.email LIKE '%@admin.com') OR (new.email LIKE '%@ahjazly.com') THEN
        v_role_str := 'SUPERUSER';
    ELSE
        v_role_str := 'TRAVELER';
    END IF;

    -- 2. Sync Public Profile (users hub)
    INSERT INTO public.users (auth_id, full_name, email, account_status, partner_id)
    VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', 'New User'), new.email, 'active', v_partner_id)
    ON CONFLICT (auth_id) DO UPDATE SET email = EXCLUDED.email, partner_id = COALESCE(EXCLUDED.partner_id, users.partner_id);

    -- 3. Sync Roles Table (Basic role)
    INSERT INTO public.user_roles (auth_id, role, partner_id)
    VALUES (new.id, v_role_str::public.app_role, v_partner_id)
    ON CONFLICT (auth_id) DO NOTHING;

    -- 4. Sync Wallet
    INSERT INTO public.wallets (auth_id)
    VALUES (new.id)
    ON CONFLICT (auth_id) DO NOTHING;

    -- 5. Finalize JWT App Metadata (Instant Role & Partner Recognition)
    UPDATE auth.users 
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || 
        jsonb_build_object('role', v_role_str, 'partner_id', v_partner_id)
    WHERE id = new.id;

    RETURN new;
EXCEPTION WHEN OTHERS THEN
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_universal_identity();

-- 5. STAGE FIVE: SECURITY SHIELD (Gold Standard Permissions - Partner-Aware)
-- ==========================================================

DO $$ 
DECLARE 
    tbl TEXT;
    auth_tables TEXT[] := ARRAY[
        'employees', 'drivers', 'users', 'user_roles', 'ratings', 'wallets', 
        'bookings', 'booking_approvals', 'user_two_factor', 'documents', 'user_device_tokens',
        'routes', 'buses', 'cancel_policies'
    ];
    global_tables TEXT[] := ARRAY['branches', 'ui_site_settings', 'partners', 'route_stops', 'bus_classes', 'seats'];
BEGIN
    -- Authenticated Partner/Owner Access
    FOREACH tbl IN ARRAY auth_tables LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
            EXECUTE format('DROP POLICY IF EXISTS "Standard partner access" ON public.%I', tbl);
            
            DECLARE
                v_using_clause TEXT := '(auth.jwt() -> ''app_metadata'' ->> ''role'') = ''SUPERUSER''';
            BEGIN
                -- Add Owner check if auth_id exists
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'auth_id') THEN
                    v_using_clause := v_using_clause || ' OR auth_id = auth.uid()';
                END IF;

                -- Add Partner check if partner_id exists
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'partner_id') THEN
                    v_using_clause := v_using_clause || format(' OR (
                        (auth.jwt() -> ''app_metadata'' ->> ''partner_id'')::bigint = %I.partner_id
                        AND (auth.jwt() -> ''app_metadata'' ->> ''role'') IN (''PARTNER_ADMIN'', ''manager'', ''accountant'', ''support'', ''supervisor'')
                    )', tbl);
                END IF;

                EXECUTE format('CREATE POLICY "Standard partner access" ON public.%I FOR ALL USING (%s)', tbl, v_using_clause);
            END;
        END IF;
    END LOOP;

    -- Public Global Views
    FOREACH tbl IN ARRAY global_tables LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = tbl) THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
            EXECUTE format('DROP POLICY IF EXISTS "Public view" ON public.%I', tbl);
            EXECUTE format('CREATE POLICY "Public view" ON public.%I FOR SELECT USING (true)', tbl);
        END IF;
    END LOOP;
END $$;

-- 6. SPECIAL POLICIES (Joins & Settings)
-- ==========================================================
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trips') THEN
        ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Drivers can view own trips" ON public.trips;
        CREATE POLICY "Drivers can view own trips" ON public.trips 
            FOR SELECT USING (
                EXISTS (SELECT 1 FROM public.drivers d WHERE d.driver_id = trips.driver_id AND d.auth_id = auth.uid()) 
                OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERUSER'
                OR EXISTS (
                    SELECT 1 FROM public.drivers d 
                    JOIN public.user_roles ur ON ur.partner_id = d.partner_id
                    WHERE d.driver_id = trips.driver_id 
                    AND ur.auth_id = auth.uid()
                    AND ur.role IN ('PARTNER_ADMIN', 'manager', 'accountant', 'support', 'supervisor')
                )
            );
        
        DROP POLICY IF EXISTS "Drivers can update own trips status" ON public.trips;
        CREATE POLICY "Drivers can update own trips status" ON public.trips 
            FOR UPDATE USING (
                EXISTS (SELECT 1 FROM public.drivers d WHERE d.driver_id = trips.driver_id AND d.auth_id = auth.uid()) 
                OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERUSER'
            );
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'driver_settings') THEN
        ALTER TABLE public.driver_settings ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Drivers can manage own settings" ON public.driver_settings;
        CREATE POLICY "Drivers can manage own settings" ON public.driver_settings 
            FOR ALL USING (
                EXISTS (SELECT 1 FROM public.drivers d WHERE d.driver_id = driver_settings.driver_id AND d.auth_id = auth.uid()) 
                OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERUSER'
            );
    END IF;
END $$;

-- 7. RECREATE VIEWS
-- ==========================================================
CREATE OR REPLACE VIEW public.vw_user_redirection AS
SELECT 
-- [x] Stabilize Drivers relationship and FKs
-- [x] Fix 400 Bad Request in Drivers Dashboard
-- [x] Ensure structural tables visibility (403 fix)
    au.id as auth_id,
    u.account_status,
    ur.role as app_role,
    ur.partner_id,
    CASE 
        WHEN u.account_status != 'active' AND ur.role::TEXT != 'SUPERUSER' THEN 'REJECT_PENDING'
        WHEN ur.role::TEXT = 'SUPERUSER' THEN 'REDIRECT_ADMIN'
        WHEN ur.role::TEXT IN ('PARTNER_ADMIN', 'manager', 'accountant', 'support', 'supervisor') THEN 'REDIRECT_DASHBOARD'
        ELSE 'REDIRECT_LOGIN'
    END as action
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.auth_id
LEFT JOIN public.user_roles ur ON au.id = ur.auth_id;

-- 8. MASS METADATA SYNC (One-time alignment)
-- ==========================================================
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT auth_id, role, partner_id FROM public.user_roles LOOP
        UPDATE auth.users 
        SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || 
            jsonb_build_object('role', r.role::TEXT, 'partner_id', r.partner_id)
        WHERE id = r.auth_id;
    END LOOP;
END $$;

COMMIT;
