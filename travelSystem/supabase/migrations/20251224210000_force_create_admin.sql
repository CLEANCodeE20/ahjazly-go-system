-- Force creation of specific Admin user (Fixed for missing UNIQUE constraint)
-- Email: ahjazly.admin@gmail.com
-- Password: !AdminPassword 123

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    new_uid UUID;
    user_email TEXT := 'ahjazly.admin@gmail.com';
    user_pass TEXT := '!AdminPassword 123';
    existing_uid UUID;
BEGIN
    -- 1. Get existing user ID if present
    SELECT id INTO existing_uid FROM auth.users WHERE email = user_email;

    IF existing_uid IS NULL THEN
        -- Generate new ID
        new_uid := gen_random_uuid();
        
        -- Insert into auth.users
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_uid,
            'authenticated',
            'authenticated',
            user_email,
            crypt(user_pass, gen_salt('bf')),
            NOW(),
            '{"provider": "email", "providers": ["email"]}',
            '{"full_name": "System Admin"}',
            NOW(),
            NOW(),
            '',
            ''
        );
    ELSE
        new_uid := existing_uid;
        -- Update password for existing user
        UPDATE auth.users 
        SET encrypted_password = crypt(user_pass, gen_salt('bf'))
        WHERE id = new_uid;
    END IF;

    -- 2. Insert/Update public.users (Profile)
    -- We use explicit check because auth_id might not have UNIQUE constraint
    IF EXISTS (SELECT 1 FROM public.users WHERE auth_id = new_uid) THEN
        UPDATE public.users 
        SET 
            account_status = 'active',
            user_type = 'admin',
            full_name = 'System Admin'
        WHERE auth_id = new_uid;
    ELSE
        INSERT INTO public.users (auth_id, email, full_name, user_type, account_status)
        VALUES (new_uid, user_email, 'System Admin', 'admin', 'active');
    END IF;

    -- 3. Insert/Update public.user_roles (Role)
    IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = new_uid) THEN
        UPDATE public.user_roles 
        SET role = 'admin', partner_id = NULL
        WHERE user_id = new_uid;
    ELSE
        INSERT INTO public.user_roles (user_id, role, partner_id)
        VALUES (new_uid, 'admin', NULL);
    END IF;

END $$;
