-- ========================================================
-- NOTIFY ADMINS ON NEW PARTNER APPLICATION (FIXED)
-- Trigger: INSERT on partner_applications
-- Action: Create notification for valid SUPERUSER/ADMINs
-- Fixes: Uses auth_id instead of user_id, action_url instead of link
-- ========================================================

CREATE OR REPLACE FUNCTION public.notify_admin_on_new_application()
RETURNS TRIGGER AS $$
DECLARE
  admin_record RECORD;
BEGIN
  -- 1. Loop through all admins/superusers
  FOR admin_record IN 
    SELECT u.auth_id 
    FROM public.users u
    JOIN public.user_roles ur ON u.auth_id = ur.auth_id
    WHERE ur.role IN ('SUPERUSER', 'ADMIN')
  LOOP
    
    -- 2. Insert notification for each admin
    INSERT INTO public.notifications (
      auth_id,        -- corrected from user_id
      title,
      message,
      type,
      priority,
      action_url,     -- corrected from link
      metadata
    ) VALUES (
      admin_record.auth_id,
      'طلب انضمام شريك جديد',
      'قام ' || NEW.company_name || ' بتقديم طلب انضمام جديد للمنصة. يرجى المراجعة.',
      'system',       -- corrected from system_alert to match ENUM
      'high',
      '/admin/partners?tab=applications',
      json_build_object(
        'application_id', NEW.application_id,
        'company_name', NEW.company_name,
        'owner_phone', NEW.owner_phone
      )
    );
    
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create Trigger
DROP TRIGGER IF EXISTS trigger_new_application_notification ON public.partner_applications;

CREATE TRIGGER trigger_new_application_notification
  AFTER INSERT ON public.partner_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_on_new_application();
