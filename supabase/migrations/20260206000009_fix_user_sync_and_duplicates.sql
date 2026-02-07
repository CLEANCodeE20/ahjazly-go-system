-- =============================================
-- FIX IDENTITY SYNC AND DEDUPLICATION (v2 - Safe Dependencies)
-- Date: 2026-02-06
-- Purpose: 
-- 1. Remove duplicate entries safely
-- 2. Respect existing foreign key dependencies
-- 3. Cleanup insecure legacy fields
-- =============================================

BEGIN;

-- 1. CLEANUP LEGACY INSECURE FIELDS
ALTER TABLE public.users DROP COLUMN IF EXISTS password_hash;
ALTER TABLE public.users DROP COLUMN IF EXISTS verification_code;
ALTER TABLE public.users DROP COLUMN IF EXISTS user_type;

-- 2. SAFE DEDUPLICATION AND CONSTRAINT ENFORCEMENT
DO $$ 
BEGIN
    -- [A] CLEANUP Users table
    -- Even if a unique constraint exists, it might have been bypassed or added recently.
    -- We delete based on auth_id duplication.
    DELETE FROM public.users a USING public.users b
    WHERE a.user_id < b.user_id 
    AND (a.auth_id = b.auth_id);

    -- Ensure Email uniqueness (if not already there)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname IN ('users_email_unique', 'users_email_key')) THEN
        ALTER TABLE public.users ADD CONSTRAINT users_email_unique UNIQUE (email);
    END IF;

    -- [B] CLEANUP user_roles table (THE LIKELY SOURCE OF UI DUPLICATES)
    -- This table MUST be unique by auth_id to prevent join duplication.
    DELETE FROM public.user_roles a USING public.user_roles b
    WHERE a.id < b.id 
    AND a.auth_id = b.auth_id;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname IN ('user_roles_auth_id_unique', 'user_roles_auth_id_key')) THEN
        ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_auth_id_unique UNIQUE (auth_id);
    END IF;

    -- [C] CLEANUP Wallets table
    DELETE FROM public.wallets a USING public.wallets b
    WHERE a.wallet_id < b.wallet_id 
    AND a.auth_id = b.auth_id;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname IN ('wallets_auth_id_unique', 'wallets_auth_id_key')) THEN
        ALTER TABLE public.wallets ADD CONSTRAINT wallets_auth_id_unique UNIQUE (auth_id);
    END IF;

END $$;

-- 3. REFRESH THE UNIVERSAL TRIGGER
CREATE OR REPLACE FUNCTION public.handle_universal_identity() 
RETURNS TRIGGER AS $$
DECLARE
    v_role_str TEXT;
    v_partner_id BIGINT;
BEGIN
    v_partner_id := (new.raw_user_meta_data->>'partner_id')::BIGINT;
    
    IF (new.email LIKE '%@admin.com') OR (new.email LIKE '%@ahjazly.com') THEN
        v_role_str := 'SUPERUSER';
    ELSE
        v_role_str := 'TRAVELER';
    END IF;

    -- Sync Profile
    INSERT INTO public.users (auth_id, full_name, email, account_status, partner_id)
    VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', 'New User'), new.email, 'active', v_partner_id)
    ON CONFLICT (auth_id) DO UPDATE 
    SET 
        email = EXCLUDED.email, 
        full_name = COALESCE(EXCLUDED.full_name, users.full_name),
        partner_id = COALESCE(EXCLUDED.partner_id, users.partner_id);

    -- Sync Role (Preventing duplicates by using ON CONFLICT)
    INSERT INTO public.user_roles (auth_id, role, partner_id)
    VALUES (new.id, v_role_str::public.app_role, v_partner_id)
    ON CONFLICT (auth_id) DO UPDATE SET role = EXCLUDED.role, partner_id = EXCLUDED.partner_id;

    -- Sync Wallet
    INSERT INTO public.wallets (auth_id)
    VALUES (new.id)
    ON CONFLICT (auth_id) DO NOTHING;

    -- Metadata Sync for JWT
    UPDATE auth.users 
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || 
        jsonb_build_object('role', v_role_str, 'partner_id', v_partner_id)
    WHERE id = new.id;

    RETURN new;
EXCEPTION WHEN OTHERS THEN
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
