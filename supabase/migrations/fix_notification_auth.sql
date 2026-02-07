-- ========================================================
-- FIX NOTIFICATION TRIGGER AUTH
-- Issue: current_setting('app.settings.service_role_key') was null
-- Fix: Hardcode the Service Role Key (User must replace placeholder)
-- ========================================================

CREATE OR REPLACE FUNCTION public.handle_new_notification()
RETURNS TRIGGER AS $$
DECLARE
  -- ⚠️⚠️⚠️ REPLACE 'YOUR_SERVICE_ROLE_KEY_HERE' WITH YOUR ACTUAL KEY ⚠️⚠️⚠️
  -- You can find this in Supabase Dashboard -> Project Settings -> API -> Service Role Secret
  v_service_key TEXT := 'YOUR_SERVICE_ROLE_KEY_HERE';
BEGIN
  -- Call the Edge Function
  PERFORM net.http_post(
    url := 'https://kbgbftyvbdgyoeosxlok.supabase.co/functions/v1/notify',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_key
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
    RAISE WARNING 'Failed to trigger notification edge function: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create Trigger (Just to be safe/clean)
DROP TRIGGER IF EXISTS trigger_handle_new_notification ON public.notifications;

CREATE TRIGGER trigger_handle_new_notification
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_notification();
