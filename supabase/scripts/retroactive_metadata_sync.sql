-- RETROACTIVE SYNC: Force update metadata for ALL users based on user_roles
-- This fixes users who were assigned roles BEFORE the trigger was created.

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT auth_id, role, partner_id FROM public.user_roles
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
