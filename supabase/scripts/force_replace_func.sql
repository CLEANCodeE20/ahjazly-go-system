-- FORCE REPLACE: handle_universal_identity
-- This ensures that even if a previous version had 'user_type', it's overwritten now.

CREATE OR REPLACE FUNCTION public.handle_universal_identity() 
RETURNS TRIGGER AS $$
DECLARE
    v_role_str TEXT;
    v_partner_id BIGINT;
BEGIN
    v_partner_id := (new.raw_user_meta_data->>'partner_id')::BIGINT;
    
    -- Strict Logic - simple and clean
    IF (new.email LIKE '%@admin.com') OR (new.email LIKE '%@ahjazly.com') THEN
        v_role_str := 'SUPERUSER';
    ELSE
        v_role_str := 'TRAVELER';
    END IF;

    -- Sync Profile (NO USER_TYPE HERE)
    INSERT INTO public.users (auth_id, full_name, email, account_status, partner_id)
    VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', 'New User'), new.email, 'active', v_partner_id)
    ON CONFLICT (auth_id) DO UPDATE 
    SET 
        email = EXCLUDED.email, 
        full_name = COALESCE(EXCLUDED.full_name, users.full_name),
        partner_id = COALESCE(EXCLUDED.partner_id, users.partner_id);

    -- Sync Role
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
