-- Trigger to notify partner owner when application is approved
-- Created: 2026-01-09

-- 1. Create the function to call the notify Edge Function with direct email
CREATE OR REPLACE FUNCTION public.notify_partner_application_approved()
RETURNS TRIGGER AS $$
DECLARE
  payload JSONB;
BEGIN
  -- Only proceed if status changed to 'approved'
  IF OLD.status != 'approved' AND NEW.status = 'approved' THEN
    
    -- Construct the payload with direct email/name
    payload := json_build_object(
      'email', NEW.owner_email,
      'name', NEW.owner_name,
      'title', 'تم قبول طلب انضمام شركتكم',
      'message', 'تهانينا! تم قبول طلب انضمام شركة ' || NEW.company_name || ' إلى منصة احجزلي. يمكنك الآن تسجيل الدخول باستخدام البريد الإلكتروني وكلمة المرور التي قمت بتسجيلها، والبدء بإعداد أسطولك ورحلاتك.',
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the Trigger
DROP TRIGGER IF EXISTS on_application_approved ON public.partner_applications;
CREATE TRIGGER on_application_approved
  AFTER UPDATE ON public.partner_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_partner_application_approved();
