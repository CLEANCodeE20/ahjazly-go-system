-- FIX LEGACY FUNCTIONS
-- Replacing functions that still reference 'user_type' with 'user_roles' logic.

-- 1. FIX: notify_admin_on_rating_reports
CREATE OR REPLACE FUNCTION public.notify_admin_on_rating_reports()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
    v_report_count INTEGER;
    v_admin_auth_id UUID;
BEGIN
    SELECT COUNT(*) INTO v_report_count FROM public.rating_reports WHERE rating_id = NEW.rating_id AND status = 'pending';
    
    IF v_report_count >= 3 THEN
        -- CHANGED: Query user_roles instead of users.user_type
        FOR v_admin_auth_id IN (
            SELECT auth_id 
            FROM public.user_roles 
            WHERE role = 'SUPERUSER' OR role = 'admin' -- Covering both legacy and new role names
        ) LOOP
            INSERT INTO public.notifications (auth_id, title, message, type, priority)
            VALUES (v_admin_auth_id, 'بلاغ تقييم', format('تنبيه: التقييم رقم %s تم الإبلاغ عنه %s مرات.', NEW.rating_id, v_report_count), 'system', 'high');
        END LOOP;
    END IF;
    RETURN NEW;
END;
$function$;

-- 2. FIX: notify_admin_new_partner
CREATE OR REPLACE FUNCTION public.notify_admin_new_partner()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
    v_admin_auth_id UUID;
BEGIN
    -- CHANGED: Query user_roles instead of users.user_type
    SELECT auth_id INTO v_admin_auth_id 
    FROM public.user_roles 
    WHERE role = 'SUPERUSER' OR role = 'admin' 
    LIMIT 1;

    IF v_admin_auth_id IS NOT NULL THEN
        INSERT INTO public.notifications (auth_id, title, message, type, priority)
        VALUES (v_admin_auth_id, 'طلب انضمام جديد', 'تقدمت شركة ' || NEW.company_name || ' بطلب انضمام.', 'system', 'high');
    END IF;
    RETURN NEW;
END;
$function$;

-- 3. FIX: create_driver_with_account
CREATE OR REPLACE FUNCTION public.create_driver_with_account(p_auth_id uuid, p_email text, p_full_name text, p_phone_number text, p_partner_id bigint, p_license_number text, p_license_expiry date, p_hire_date date DEFAULT CURRENT_DATE)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_user_id BIGINT;
    v_driver_id BIGINT;
BEGIN
    -- 1. Sync/Create User Profile (REMOVED user_type)
    INSERT INTO public.users (
        auth_id, email, full_name, phone_number,
        partner_id, account_status
    ) VALUES (
        p_auth_id, p_email, p_full_name, p_phone_number,
        p_partner_id, 'active'
    )
    ON CONFLICT (auth_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone_number = EXCLUDED.phone_number,
        partner_id = EXCLUDED.partner_id,
        account_status = 'active'
    RETURNING user_id INTO v_user_id;

    -- 1.1 Ensure Role Exists (Added this step)
    INSERT INTO public.user_roles (auth_id, role, partner_id)
    VALUES (p_auth_id, 'driver', p_partner_id)
    ON CONFLICT (auth_id) DO UPDATE SET
        role = 'driver',
        partner_id = EXCLUDED.partner_id;

    -- 2. Sync/Create Driver Record
    INSERT INTO public.drivers (
        partner_id, full_name, phone_number,
        license_number, license_expiry, hire_date, status, auth_id
    ) VALUES (
        p_partner_id, p_full_name, p_phone_number,
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
$function$;
