-- MIGRATE LEGACY PARTNER ROLES
-- The app expects 'PARTNER_ADMIN', but some legacy data has 'partner'.
-- This script fixes that discrepancy.

BEGIN;

-- 1. Update user_roles table
UPDATE public.user_roles
SET role = 'PARTNER_ADMIN'
WHERE role = 'partner';

-- 2. Retroactive Metadata Sync (Again, to capture these changes)
-- Since we just updated the roles, we need to push these changes to auth.users
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT auth_id, role, partner_id FROM public.user_roles WHERE role = 'PARTNER_ADMIN'
    LOOP
        UPDATE auth.users
        SET raw_app_meta_data = 
            COALESCE(raw_app_meta_data, '{}'::jsonb) || 
            jsonb_build_object(
                'role', r.role,
                'partner_id', r.partner_id
            )
        WHERE id = r.auth_id;
    END LOOP;
END $$;

COMMIT;
