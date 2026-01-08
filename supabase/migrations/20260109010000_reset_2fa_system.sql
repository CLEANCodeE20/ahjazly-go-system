-- RPC to reset 2FA for a user with audit logging
-- Created: 2026-01-09

CREATE OR REPLACE FUNCTION public.reset_user_2fa(target_auth_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_changed_by UUID := auth.uid();
    v_user_name TEXT;
    v_user_email TEXT;
BEGIN
    -- 1. Check if caller is admin
    IF NOT public.has_role(v_changed_by, 'admin') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Only admins can reset 2FA');
    END IF;

    -- 2. Fetch user info for logging
    SELECT full_name, email INTO v_user_name, v_user_email
    FROM public.users
    WHERE auth_id = target_auth_id;

    -- 3. Delete 2FA records
    DELETE FROM public.user_two_factor WHERE auth_id = target_auth_id;
    DELETE FROM public.user_verification_codes WHERE auth_id = target_auth_id;

    -- 4. Log the action in audit_logs
    INSERT INTO public.audit_logs (
        table_name,
        record_id,
        operation,
        old_data,
        new_data,
        changed_by
    ) VALUES (
        'user_two_factor',
        target_auth_id::text,
        'RESET_2FA',
        jsonb_build_object('email', v_user_email, 'name', v_user_name, 'status', '2FA Enabled (before reset)'),
        jsonb_build_object('status', '2FA Disabled (after reset)'),
        v_changed_by
    );

    -- 5. Return success
    RETURN jsonb_build_object('success', true, 'message', 'تم إعادة تعيين التحقق الثنائي بنجاح للمستخدم: ' || v_user_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION public.reset_user_2fa(UUID) TO authenticated;
