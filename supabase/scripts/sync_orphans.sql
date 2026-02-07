-- Helper Script: Sync Orphans
-- This script finds users in auth.users who are missing from public.users or public.user_roles and adds them.

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT id, email, raw_user_meta_data 
        FROM auth.users 
        WHERE id NOT IN (SELECT auth_id FROM public.users)
    LOOP
        RAISE NOTICE 'Syncing orphan user: % (%)', r.email, r.id;
        
        -- 1. Insert into public.users
        INSERT INTO public.users (auth_id, email, full_name, account_status)
        VALUES (
            r.id, 
            r.email, 
            COALESCE(r.raw_user_meta_data->>'full_name', 'Recovered User'), 
            'active'
        )
        ON CONFLICT (auth_id) DO NOTHING;

        -- 2. Insert into public.wallets
        INSERT INTO public.wallets (auth_id)
        VALUES (r.id)
        ON CONFLICT (auth_id) DO NOTHING;
    END LOOP;

    -- 3. Sync missing Roles (default to 'user' if unknown, or based on metadata)
    FOR r IN 
        SELECT id, raw_user_meta_data 
        FROM auth.users 
        WHERE id NOT IN (SELECT auth_id FROM public.user_roles)
    LOOP
        RAISE NOTICE 'Syncing orphan role for: %', r.id;
        
        INSERT INTO public.user_roles (auth_id, role)
        VALUES (
            r.id, 
            COALESCE((r.raw_user_meta_data->>'role')::public.app_role, 'user')
        )
        ON CONFLICT (auth_id) DO NOTHING;
    END LOOP;
    
END $$;
