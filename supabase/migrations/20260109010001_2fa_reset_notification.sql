-- Trigger to notify user when their 2FA is reset by an admin
-- Created: 2026-01-09

-- 1. Create the function to call the notify Edge Function for 2FA Reset
CREATE OR REPLACE FUNCTION public.notify_2fa_reset()
RETURNS TRIGGER AS $$
DECLARE
  v_user_email TEXT;
  v_user_name TEXT;
  payload JSONB;
BEGIN
  -- Only proceed for '2FA Reset' operation in audit_logs
  IF NEW.table_name = 'user_two_factor' AND NEW.operation = '2FA Reset' THEN
    
    -- Get user details from users table
    SELECT email, full_name INTO v_user_email, v_user_name
    FROM public.users
    WHERE auth_id = (NEW.record_id)::uuid;

    IF v_user_email IS NOT NULL THEN
        -- Construct the payload
        payload := json_build_object(
          'email', v_user_email,
          'name', COALESCE(v_user_name, 'مستخدم احجزلي'),
          'title', 'أمن الحساب: تم إعادة تعيين التحقق بخطوتين',
          'message', 'نحيطكم علماً بأنه تم إعادة تعيين إعدادات التحقق بخطوتين (2FA) لحسابكم بواسطة مسؤول النظام. إذا لم تكن أنت من طلب هذا الإجراء، يرجى التواصل مع الدعم الفني فوراً وتغيير كلمة المرور الخاصة بك.',
          'priority', 'high'
        );

        -- Call the Supabase Edge Function
        PERFORM
          net.http_post(
            url := 'https://kbgbftyvbdgyoeosxlok.supabase.co/functions/v1/notify',
            headers := jsonb_build_object(
              'Content-Type', 'application/json',
              'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
            ),
            body := payload
          );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the Trigger on audit_logs
DROP TRIGGER IF EXISTS on_2fa_reset_log ON public.audit_logs;
CREATE TRIGGER on_2fa_reset_log
  AFTER INSERT ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_2fa_reset();
