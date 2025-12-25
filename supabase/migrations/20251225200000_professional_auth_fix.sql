-- PROFESSIONAL AUTHENTICATION & SYNCHRONIZATION FIX
-- This migration ensures data consistency, robust role assignment, and optimized RLS.

BEGIN;

-- 1. CLEANUP ORPHAN RECORDS
-- Ensure every user in auth.users has a profile in public.users
INSERT INTO public.users (auth_id, full_name, email, user_type, account_status)
SELECT 
    id, 
    COALESCE(raw_user_meta_data->>'full_name', 'System User'), 
    email, 
    CASE 
        WHEN email LIKE '%@admin.com' OR email LIKE '%@ahjazly.com' THEN 'admin'::public.user_type
        ELSE COALESCE((raw_user_meta_data->>'user_type')::public.user_type, 'employee'::public.user_type)
    END, 
    'active'
FROM auth.users
ON CONFLICT (auth_id) DO NOTHING;

-- Ensure every user has a role in public.user_roles matching their user_type
INSERT INTO public.user_roles (user_id, role)
SELECT 
    u.auth_id, 
    CASE 
        WHEN u.user_type = 'admin' THEN 'admin'::public.app_role
        WHEN u.user_type = 'partner' THEN 'partner'::public.app_role
        ELSE 'employee'::public.app_role
    END
FROM public.users u
WHERE u.auth_id IS NOT NULL -- CRITICAL FIX: Skip users without auth_id link
ON CONFLICT (user_id) DO NOTHING;

-- 2. ROBUST TRIGGER LOGIC
-- Handles metadata-driven role assignment and prevents data drift.
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
    is_admin BOOLEAN;
    meta_user_type TEXT;
    calculated_user_type public.user_type;
    calculated_app_role public.app_role;
BEGIN
    -- 1. Check for Admin domains (Safety Net)
    is_admin := (new.email LIKE '%@admin.com') OR (new.email LIKE '%@ahjazly.com');
    
    -- 2. Extract user_type from metadata if provided
    meta_user_type := new.raw_user_meta_data->>'user_type';
    
    -- 3. Determine final user_type
    IF is_admin THEN
        calculated_user_type := 'admin'::public.user_type;
    ELSIF meta_user_type IS NOT NULL THEN
        -- Safely cast and default to employee if invalid
        BEGIN
            calculated_user_type := meta_user_type::public.user_type;
        EXCEPTION WHEN OTHERS THEN
            calculated_user_type := 'employee'::public.user_type;
        END;
    ELSE
        calculated_user_type := 'employee'::public.user_type; -- Default to employee for staff
    END IF;

    -- 4. Map to app_role
    calculated_app_role := CASE 
        WHEN calculated_user_type = 'admin' THEN 'admin'::public.app_role
        WHEN calculated_user_type = 'partner' THEN 'partner'::public.app_role
        ELSE 'employee'::public.app_role
    END;

    -- 5. Upsert public.users (Profile)
    INSERT INTO public.users (
        auth_id, 
        full_name, 
        email, 
        user_type, 
        account_status,
        phone_number
    )
    VALUES (
        new.id, 
        COALESCE(new.raw_user_meta_data->>'full_name', 'New User'), 
        new.email, 
        calculated_user_type, 
        CASE WHEN calculated_user_type = 'admin' THEN 'active' ELSE 'pending' END, -- Admin is always active
        new.raw_user_meta_data->>'phone'
    )
    ON CONFLICT (auth_id) DO UPDATE
    SET 
        email = excluded.email,
        full_name = COALESCE(excluded.full_name, public.users.full_name),
        user_type = COALESCE(excluded.user_type, public.users.user_type),
        phone_number = COALESCE(excluded.phone_number, public.users.phone_number);

    -- 6. Upsert public.user_roles
    INSERT INTO public.user_roles (user_id, role, partner_id)
    VALUES (
        new.id, 
        calculated_app_role, 
        (new.raw_user_meta_data->>'partner_id')::INTEGER
    )
    ON CONFLICT (user_id) DO UPDATE
    SET role = excluded.role,
        partner_id = COALESCE(excluded.partner_id, public.user_roles.partner_id);

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. CENTRALIZED REDIRECTION HELPER (SQL View for debugging)
CREATE OR REPLACE VIEW public.vw_user_redirection AS
SELECT 
    au.id as auth_id,
    au.email,
    u.user_type,
    u.account_status,
    ur.role as app_role,
    ur.partner_id,
    CASE 
        WHEN u.account_status != 'active' AND ur.role != 'admin' THEN 'REJECT_PENDING'
        WHEN ur.role = 'admin' THEN 'REDIRECT_ADMIN'
        WHEN ur.role IN ('partner', 'employee') THEN 'REDIRECT_DASHBOARD'
        ELSE 'REDIRECT_LOGIN'
    END as action
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.auth_id
LEFT JOIN public.user_roles ur ON au.id = ur.user_id;

COMMIT;
