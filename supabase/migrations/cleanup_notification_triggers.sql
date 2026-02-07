-- ========================================================
-- CLEANUP: REMOVE CONFLICTING NOTIFICATION TRIGGERS
-- ========================================================

-- 1. Drop the OLD trigger if it exists
DROP TRIGGER IF EXISTS on_notification_added ON public.notifications;
DROP TRIGGER IF EXISTS trigger_notification_dispatch ON public.notifications;

-- 2. Drop the OLD function
DROP FUNCTION IF EXISTS public.trigger_notification_dispatch();

-- 3. Ensure the NEW trigger is active and clean
-- We will re-apply the latest fix just to be 100% sure it's the only one
CREATE OR REPLACE FUNCTION public.handle_new_notification()
RETURNS TRIGGER AS $$
DECLARE
  -- This is the key you pasted in the previous step
  v_service_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiZ2JmdHl2YmRneW9lb3N4bG9rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjU3MTExNywiZXhwIjoyMDgyMTQ3MTE3fQ.-oiIri8pTmxJATXAmyYU8K8sobTtI4e7kHGeqHX0mwoE';
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

-- Re-create only the NEW trigger
DROP TRIGGER IF EXISTS trigger_handle_new_notification ON public.notifications;

CREATE TRIGGER trigger_handle_new_notification
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_notification();
