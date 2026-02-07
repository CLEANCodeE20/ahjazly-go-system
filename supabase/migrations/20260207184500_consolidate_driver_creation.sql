-- ==========================================================
-- STRATEGIC IDENTITY UNIFICATION (FINAL DRIVER FIX - V2)
-- Purpose: Standardize on auth_id & fix user_roles unique constraint conflict.
-- ==========================================================

BEGIN;

-- 1. Ensure Role Enum is Ready
DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'DRIVER') THEN
        ALTER TYPE public.app_role ADD VALUE 'DRIVER';
    END IF;
END $$;

-- 2. Standardize user_roles Column (Renaming user_id to auth_id if it exists)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_roles' AND column_name = 'user_id') THEN
        ALTER TABLE public.user_roles RENAME COLUMN user_id TO auth_id;
    END IF;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 3. Recovery Function: Robust Auth Discovery
DROP FUNCTION IF EXISTS public.get_auth_id_by_email(TEXT) CASCADE;
CREATE OR REPLACE FUNCTION public.get_auth_id_by_email(p_email TEXT)
RETURNS UUID AS $$
    SELECT id FROM auth.users WHERE email = p_email;
$$ LANGUAGE sql SECURITY DEFINER;

-- 4. Fix handle_universal_identity (Trigger on auth.users)
CREATE OR REPLACE FUNCTION public.handle_universal_identity() 
RETURNS TRIGGER AS $$
DECLARE
    v_role_str TEXT;
    v_partner_id BIGINT;
BEGIN
    v_partner_id := (new.raw_user_meta_data->>'partner_id')::BIGINT;
    v_role_str := CASE 
        WHEN (new.email LIKE '%@admin.com') OR (new.email LIKE '%@ahjazly.com') THEN 'SUPERUSER'
        ELSE 'TRAVELER'
    END;

    -- Sync Profile
    INSERT INTO public.users (auth_id, email, full_name, phone_number, partner_id, account_status)
    VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'full_name', 'New User'), NULL, v_partner_id, 'active')
    ON CONFLICT (auth_id) DO UPDATE SET email = EXCLUDED.email;

    -- Sync Role (Match the unique constraint on auth_id)
    INSERT INTO public.user_roles (auth_id, role, partner_id)
    VALUES (new.id, v_role_str::public.app_role, v_partner_id)
    ON CONFLICT (auth_id) DO UPDATE SET role = EXCLUDED.role, partner_id = EXCLUDED.partner_id;

    -- Sync Wallet
    INSERT INTO public.wallets (auth_id) VALUES (new.id) ON CONFLICT (auth_id) DO NOTHING;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. THE STRATEGIC DRIVER RPC (Robust version)
DROP FUNCTION IF EXISTS public.create_driver_with_account(p_auth_id uuid, p_email text, p_full_name text, p_phone_number text, p_partner_id bigint, p_license_number text, p_license_expiry date, p_hire_date date);
DROP FUNCTION IF EXISTS public.create_driver_with_account(p_full_name VARCHAR, p_email VARCHAR, p_phone_number VARCHAR, p_partner_id BIGINT, p_license_number VARCHAR, p_license_expiry DATE, p_hire_date DATE, p_auth_id UUID);
DROP FUNCTION IF EXISTS public.create_driver_with_account(TEXT, TEXT, TEXT, BIGINT, TEXT, DATE, DATE, UUID);

CREATE OR REPLACE FUNCTION public.create_driver_with_account(
    p_full_name TEXT,
    p_email TEXT,
    p_phone_number TEXT,
    p_partner_id BIGINT,
    p_license_number TEXT,
    p_license_expiry DATE,
    p_hire_date DATE DEFAULT CURRENT_DATE,
    p_auth_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_driver_id BIGINT;
    v_final_auth_id UUID := p_auth_id;
BEGIN
    -- Recovery Logic
    IF v_final_auth_id IS NULL THEN
        SELECT id INTO v_final_auth_id FROM auth.users WHERE email = p_email;
    END IF;

    IF v_final_auth_id IS NULL THEN
        RAISE EXCEPTION 'User account not found for email %', p_email;
    END IF;

    -- A. Sync User Profile
    INSERT INTO public.users (auth_id, email, full_name, phone_number, partner_id, account_status)
    VALUES (v_final_auth_id, p_email, p_full_name, p_phone_number, p_partner_id, 'active')
    ON CONFLICT (auth_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone_number = EXCLUDED.phone_number,
        partner_id = EXCLUDED.partner_id,
        account_status = 'active';

    -- B. Update Role to DRIVER (Using ON CONFLICT (auth_id) to match table constraint)
    INSERT INTO public.user_roles (auth_id, role, partner_id)
    VALUES (v_final_auth_id, 'DRIVER', p_partner_id)
    ON CONFLICT (auth_id) DO UPDATE SET
        role = EXCLUDED.role,
        partner_id = EXCLUDED.partner_id;

    -- C. Sync Driver Professional Record
    INSERT INTO public.drivers (
        partner_id, full_name, phone_number,
        license_number, license_expiry, hire_date, status, auth_id
    ) VALUES (
        p_partner_id, p_full_name, p_phone_number,
        p_license_number, p_license_expiry, p_hire_date, 'active', v_final_auth_id
    )
    ON CONFLICT (auth_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone_number = EXCLUDED.phone_number,
        license_number = EXCLUDED.license_number,
        license_expiry = EXCLUDED.license_expiry,
        status = 'active'
    RETURNING driver_id INTO v_driver_id;

    -- D. Ensure Default Settings Exist
    INSERT INTO public.driver_settings (driver_id) VALUES (v_driver_id) ON CONFLICT (driver_id) DO NOTHING;

    RETURN jsonb_build_object('success', true, 'driver_id', v_driver_id, 'auth_id', v_final_auth_id);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
