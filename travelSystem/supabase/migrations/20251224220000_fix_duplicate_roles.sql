-- FIX DUPLICATES & ENFORCE CONSTRAINTS (Fixed: Drop Old PK First)
-- This script removes duplicate roles and enforces a strict 1-role-per-user rule.

BEGIN;

-- 1. Create temporary backup of UNIQUE roles
CREATE TEMP TABLE unique_roles AS
SELECT DISTINCT ON (user_id) *
FROM public.user_roles
ORDER BY user_id, 
    CASE role 
        WHEN 'admin'::app_role THEN 1 
        WHEN 'partner'::app_role THEN 2 
        WHEN 'employee'::app_role THEN 3 
        ELSE 4 
    END;

-- 2. Clear the table (safest way to remove all duplicates)
-- logic: we have the data safe in unique_roles
TRUNCATE public.user_roles CASCADE;

-- 3. Restoration
INSERT INTO public.user_roles SELECT * FROM unique_roles;

-- 4. Enforce Constraint
-- First, drop the old Primary Key (whatever it was)
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_pkey;

-- Now add the new Primary Key on user_id
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id);

-- 5. Repeat for Profiles (users table) just in case
DELETE FROM public.users a
USING public.users b
WHERE a.auth_id = b.auth_id 
  AND a.ctid < b.ctid;

-- Ensure auth_id is UNIQUE
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_auth_id_key;
ALTER TABLE public.users ADD CONSTRAINT users_auth_id_key UNIQUE (auth_id);


COMMIT;
