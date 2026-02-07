
-- COMPREHENSIVE FIX FOR PARTNER LOGIN AND PERMISSIONS
-- Run this in Supabase SQL Editor

BEGIN;

--------------------------------------------------------------------------------
-- 1. Fix Enum: Ensure 'PARTNER_ADMIN' exists
--------------------------------------------------------------------------------
DO $$
BEGIN
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'PARTNER_ADMIN';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

--------------------------------------------------------------------------------
-- 2. Metadata Sync Trigger (The missing link for login)
-- This ensures that when a role is assigned in 'user_roles', it is immediately
-- reflected in 'auth.users' metadata, so the NEXT token issued has the correct role.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_user_role_to_metadata()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE auth.users
    SET raw_app_meta_data = 
        COALESCE(raw_app_meta_data, '{}'::jsonb) || 
        jsonb_build_object(
            'role', NEW.role,
            'partner_id', NEW.partner_id
        )
    WHERE id = NEW.auth_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sync_user_role ON public.user_roles;
CREATE TRIGGER trigger_sync_user_role
AFTER INSERT OR UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_role_to_metadata();

--------------------------------------------------------------------------------
-- 3. RLS Policies: Allow 'PARTNER_ADMIN' to access tables
--------------------------------------------------------------------------------
DO $$ 
DECLARE 
    tbl TEXT;
    auth_tables TEXT[] := ARRAY[
        'employees', 'drivers', 'users', 'user_roles', 'ratings', 'wallets', 
        'bookings', 'booking_approvals', 'user_two_factor', 'documents', 'user_device_tokens',
        'routes', 'buses', 'cancel_policies'
    ];
BEGIN
    FOREACH tbl IN ARRAY auth_tables LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
            -- Re-define the policy to strictly allow PARTNER_ADMIN
            EXECUTE format('DROP POLICY IF EXISTS "Standard partner access" ON public.%I', tbl);
            
            DECLARE
                v_using_clause TEXT := '(auth.jwt() -> ''app_metadata'' ->> ''role'') IN (''SUPERUSER'', ''admin'')';
            BEGIN
                -- Add Owner check
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'auth_id') THEN
                    v_using_clause := v_using_clause || ' OR auth_id = auth.uid()';
                END IF;

                -- Add Partner check (Including 'partner' and 'PARTNER_ADMIN')
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'partner_id') THEN
                    -- We cast checking to ensure both legacy and new roles work
                    v_using_clause := v_using_clause || format(' OR (
                        (auth.jwt() -> ''app_metadata'' ->> ''partner_id'')::bigint = %I.partner_id
                        AND (auth.jwt() -> ''app_metadata'' ->> ''role'') IN (''partner'', ''PARTNER_ADMIN'', ''manager'', ''accountant'', ''support'', ''supervisor'')
                    )', tbl);
                END IF;

                EXECUTE format('CREATE POLICY "Standard partner access" ON public.%I FOR ALL USING (%s)', tbl, v_using_clause);
            END;
        END IF;
    END LOOP;
END $$;

--------------------------------------------------------------------------------
-- 4. Retroactive Fix: Fix any existing users who are stuck as 'TRAVELER'
--------------------------------------------------------------------------------
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT auth_id, role, partner_id FROM public.user_roles WHERE role = 'PARTNER_ADMIN'
    LOOP
        UPDATE auth.users
        SET raw_app_meta_data = 
            COALESCE(raw_app_meta_data, '{}'::jsonb) || 
            jsonb_build_object('role', r.role, 'partner_id', r.partner_id)
        WHERE id = r.auth_id;
    END LOOP;
END $$;

COMMIT;
