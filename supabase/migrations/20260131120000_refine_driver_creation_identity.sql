-- =============================================
-- REFINE DRIVER CREATION IDENTITY (Gold Standard)
-- Date: 2026-01-31
-- Purpose: Support UPSERT in create_driver_with_account to prevent 
--          identity conflicts with the Universal Identity Trigger.
-- =============================================

CREATE OR REPLACE FUNCTION public.create_driver_with_account(
    p_full_name VARCHAR(255),
    p_email VARCHAR(255),
    p_phone_number VARCHAR(20),
    p_partner_id BIGINT,
    p_license_number VARCHAR(50),
    p_license_expiry DATE,
    p_hire_date DATE DEFAULT CURRENT_DATE,
    p_auth_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_user_id BIGINT;
    v_driver_id BIGINT;
BEGIN
    -- 1. Sync/Create User Profile
    -- Using ON CONFLICT because handle_universal_identity() trigger 
    -- might have already created the user record.
    INSERT INTO public.users (
        auth_id, email, full_name, phone_number,
        user_type, partner_id, account_status
    ) VALUES (
        p_auth_id, p_email, p_full_name, p_phone_number,
        'driver', p_partner_id, 'active'
    )
    ON CONFLICT (auth_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone_number = EXCLUDED.phone_number,
        user_type = 'driver',
        partner_id = EXCLUDED.partner_id,
        account_status = 'active'
    RETURNING user_id INTO v_user_id;

    -- 2. Sync/Create Driver Record
    INSERT INTO public.drivers (
        user_id, partner_id, full_name, phone_number,
        license_number, license_expiry, hire_date, status, auth_id
    ) VALUES (
        v_user_id, p_partner_id, p_full_name, p_phone_number,
        p_license_number, p_license_expiry, p_hire_date, 'active', p_auth_id
    )
    ON CONFLICT (auth_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone_number = EXCLUDED.phone_number,
        license_number = EXCLUDED.license_number,
        license_expiry = EXCLUDED.license_expiry,
        status = 'active'
    RETURNING driver_id INTO v_driver_id;

    -- 3. Ensure Default Settings Exist
    INSERT INTO public.driver_settings (driver_id)
    VALUES (v_driver_id)
    ON CONFLICT (driver_id) DO NOTHING;

    RETURN jsonb_build_object(
        'success', true,
        'user_id', v_user_id,
        'driver_id', v_driver_id
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
