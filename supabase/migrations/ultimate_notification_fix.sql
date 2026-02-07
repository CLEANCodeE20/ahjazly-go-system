-- ========================================================
-- ULTIMATE NOTIFICATION FIX (POSITIONAL ARGS + DUAL HEADERS)
-- ========================================================

CREATE OR REPLACE FUNCTION public.handle_new_notification()
RETURNS TRIGGER AS $$
DECLARE
  -- Your verified Service Role Key
  v_service_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiZ2JmdHl2YmRneW9lb3N4bG9rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjU3MTExNywiZXhwIjoyMDgyMTQ3MTE3fQ.-oiIri8pTmxJATXAmyYU8K8sobTtI4e7kHGeqHX0mwoE';
BEGIN
  -- We use POSITIONAL arguments because your pg_net version 
  -- expects (url, body, params, headers) in this order.
  PERFORM net.http_post(
    'https://kbgbftyvbdgyoeosxlok.supabase.co/functions/v1/notify', -- 1. URL
    json_build_object(                                             -- 2. Body
      'notification_id', NEW.notification_id,
      'auth_id', NEW.auth_id,
      'title', NEW.title,
      'message', NEW.message,
      'type', NEW.type,
      'priority', NEW.priority,
      'metadata', NEW.metadata
    )::jsonb,
    '{}'::jsonb,                                                   -- 3. Params (Empty)
    json_build_object(                                             -- 4. Headers
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || trim(v_service_key),
      'apikey', trim(v_service_key)
    )::jsonb
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log any database-side errors
    INSERT INTO public._debug_notif_logs (notif_id, error_msg)
    VALUES (NEW.notification_id, 'DB Error: ' || SQLERRM);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-apply trigger
DROP TRIGGER IF EXISTS trigger_handle_new_notification ON public.notifications;
CREATE TRIGGER trigger_handle_new_notification
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_notification();
