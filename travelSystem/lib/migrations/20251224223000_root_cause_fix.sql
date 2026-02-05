-- DEFINITIVE ROOT CAUSE FIX
-- This script cleans up all data inconsistencies and enforces strict schema rules.
-- It handles: Enum Casting, Duplicate Removal, Constraint Enforcement, and Trigger Safety.

BEGIN;

-- ==========================================
-- 1. CLEANUP PUBLIC.USER_ROLES (Duplicates)
-- ==========================================

-- Create a temporary table with the "Best" role for each user
-- Logic: Admin > Partner > Employee > Others
CREATE TEMP TABLE user_roles_cleanup AS
SELECT DISTINCT ON (user_id) *
FROM public.user_roles
ORDER BY user_id, 
    CASE role::text -- Cast to text to be safe
        WHEN 'admin' THEN 1 
        WHEN 'partner' THEN 2 
        WHEN 'employee' THEN 3 
        ELSE 4 
    END;

-- Wipe the table clean
TRUNCATE public.user_roles;

-- Restore only unique, valid rows
INSERT INTO public.user_roles SELECT * FROM user_roles_cleanup;

-- Drop temp table
DROP TABLE user_roles_cleanup;


-- ==========================================
-- 2. ENFORCE CONSTRAINTS ON USER_ROLES
-- ==========================================

-- Drop any existing constraints to avoid conflicts
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_pkey;
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_key;

-- Add strict PRIMARY KEY on user_id (One Role Per User)
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id);


-- ==========================================
-- 3. CLEANUP PUBLIC.USERS (Duplicates)
-- ==========================================

-- Create temp table for unique profiles
CREATE TEMP TABLE users_cleanup AS
SELECT DISTINCT ON (auth_id) *
FROM public.users
ORDER BY auth_id, created_at DESC; -- Keep the most recent profile

-- Wipe table (cascade might affect child tables, be careful - actually DELETE duplicates is safer for FKs)
-- But since we ordered by created_at DESC, the "latest" one is what we want.
-- To avoid FK issues with TRUNCATE, we use DELETE logic using CTID.

-- Alternative Safe De-duplication for users table (preserves FKs better than TRUNCATE)
DELETE FROM public.users a
USING public.users b
WHERE a.auth_id = b.auth_id 
  AND a.created_at < b.created_at; -- Delete older ones

-- ==========================================
-- 4. ENFORCE CONSTRAINTS ON USERS
-- ==========================================

-- Drop potential old keys
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_auth_id_key;

-- Add strict UNIQUE constraint on auth_id
ALTER TABLE public.users ADD CONSTRAINT users_auth_id_key UNIQUE (auth_id);


-- ==========================================
-- 5. FIX THE TRIGGER (Future Proofing)
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
    is_admin BOOLEAN;
    calculated_role TEXT;
BEGIN
    -- Check for Admin domains
    is_admin := (new.email LIKE '%@admin.com') OR (new.email LIKE '%@ahjazly.com');
    calculated_role := CASE WHEN is_admin THEN 'admin' ELSE 'employee' END; -- Default to employee per latest requirement

    -- 1. Upsert Profile
    INSERT INTO public.users (
        auth_id, 
        full_name, 
        email, 
        user_type, 
        account_status
    )
    VALUES (
        new.id, 
        COALESCE(new.raw_user_meta_data->>'full_name', 'New User'), 
        new.email, 
        calculated_role::user_type, 
        'active'::account_status
    )
    ON CONFLICT (auth_id) DO UPDATE -- Now this works because we added the constraint above!
    SET 
        email = excluded.email,
        user_type = excluded.user_type,
        account_status = excluded.account_status;

    -- 2. Upsert Role
    INSERT INTO public.user_roles (user_id, role, partner_id)
    VALUES (
        new.id, 
        calculated_role::app_role, 
        NULL
    )
    ON CONFLICT (user_id) DO UPDATE -- Now this works too!
    SET role = excluded.role;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
