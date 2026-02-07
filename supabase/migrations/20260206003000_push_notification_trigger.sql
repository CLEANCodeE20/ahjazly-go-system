-- ========================================================
-- SEND NOTIFICATION VIA EDGE FUNCTION
-- Trigger: INSERT on notifications
-- Action: Calls 'notify' Edge Function to send Email/Push/WhatsApp
-- ========================================================

CREATE OR REPLACE FUNCTION public.handle_new_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the Edge Function
  PERFORM net.http_post(
    url := 'https://kbgbftyvbdgyoeosxlok.supabase.co/functions/v1/notify',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := json_build_object(
      'notification_id', NEW.notification_id,
      'auth_id', NEW.auth_id,
      'title', NEW.title,
      'message', NEW.message,
      'type', NEW.type,
      'priority', NEW.priority,
      'metadata', NEW.metadata
    )
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail transaction
    RAISE WARNING 'Failed to trigger notification edge function: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Trigger
DROP TRIGGER IF EXISTS trigger_handle_new_notification ON public.notifications;

CREATE TRIGGER trigger_handle_new_notification
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_notification();

COMMENT ON TRIGGER trigger_handle_new_notification ON public.notifications IS 
'Triggers the notify Edge Function to send external notifications (Email, Push) when a new notification is inserted';
