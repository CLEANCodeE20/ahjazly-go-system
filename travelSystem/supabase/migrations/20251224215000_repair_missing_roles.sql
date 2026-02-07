-- REPAIR MISSING ROLES (Fixed: AppRole Enum Mismatch)
-- 'customer' is NOT a valid app_role. Valid values: 'admin', 'partner', 'employee'.
-- We will default non-admins to 'employee' to ensure they can access the dashboard if they are staff.
-- Real customers don't access this dashboard.

DO $$
DECLARE
    r RECORD;
    is_admin BOOLEAN;
    calc_role TEXT;
BEGIN
    -- Loop through all auth users who are missing a public.user_roles entry
    FOR r IN 
        SELECT au.id, au.email, au.raw_user_meta_data 
        FROM auth.users au
        LEFT JOIN public.user_roles ur ON au.id = ur.user_id
        WHERE ur.user_id IS NULL
    LOOP
        -- Determine role
        is_admin := (r.email LIKE '%@admin.com') OR (r.email LIKE '%@ahjazly.com');
        
        -- FIX: Default to 'employee' instead of 'customer', because 'customer' is not in app_role enum.
        calc_role := CASE WHEN is_admin THEN 'admin' ELSE 'employee' END;
        
        -- 1. Insert/Update Role (Manual Upsert)
        IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = r.id) THEN
            UPDATE public.user_roles 
            SET role = calc_role::app_role 
            WHERE user_id = r.id;
        ELSE
            INSERT INTO public.user_roles (user_id, role, partner_id)
            VALUES (r.id, calc_role::app_role, NULL);
        END IF;
        
        -- 2. Insert/Update Profile (Manual Upsert)
        -- user_type usually allows 'customer', 'driver', 'employee', 'admin', 'partner'.
        IF EXISTS (SELECT 1 FROM public.users WHERE auth_id = r.id) THEN
            UPDATE public.users 
            SET account_status = 'active'::account_status
            WHERE auth_id = r.id;
        ELSE
            INSERT INTO public.users (auth_id, email, full_name, user_type, account_status)
            VALUES (
                r.id, 
                r.email, 
                COALESCE(r.raw_user_meta_data->>'full_name', 'System User'), 
                calc_role::user_type, 
                'active'::account_status
            );
        END IF;
        
    END LOOP;
    
    -- Force 'admin' role for specific emails (Manual Update)
    
    -- User Roles
    UPDATE public.user_roles
    SET role = 'admin'::app_role
    FROM auth.users
    WHERE public.user_roles.user_id = auth.users.id
    AND (auth.users.email LIKE '%@admin.com' OR auth.users.email LIKE '%@ahjazly.com');
    
    -- User Profiles
    UPDATE public.users
    SET user_type = 'admin'::user_type
    FROM auth.users
    WHERE public.users.auth_id = auth.users.id
    AND (auth.users.email LIKE '%@admin.com' OR auth.users.email LIKE '%@ahjazly.com');

END $$;
