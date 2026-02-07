-- ========================================================
-- DEBUG: CAPTURE SILENT ERRORS & TEST MANUAL POST
-- ========================================================

-- 1. Create a log table for errors (since WARNINGS are hard to see)
CREATE TABLE IF NOT EXISTS public._debug_notif_logs (
    id SERIAL PRIMARY KEY,
    notif_id BIGINT,
    error_msg TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Update function to log errors to this table
CREATE OR REPLACE FUNCTION public.handle_new_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_service_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiZ2JmdHl2YmRneW9lb3N4bG9rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjU3MTExNywiZXhwIjoyMDgyMTQ3MTE3fQ.-oiIri8pTmxJATXAmyYU8K8sobTtI4e7kHGeqHX0mwoE';
  v_req_id BIGINT;
BEGIN
  -- Attempt Post
  v_req_id := net.http_post(
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
    -- LOG THE ERROR SO WE CAN SEE IT
    INSERT INTO public._debug_notif_logs (notif_id, error_msg)
    VALUES (NEW.notification_id, SQLERRM);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Run a New Test and see the result
DO $$
BEGIN
  INSERT INTO public.notifications (auth_id, title, message, type)
  SELECT auth_id, 'Deep Debug Test', 'Testing logs', 'system'
  FROM public.users LIMIT 1;
END $$;

-- 4. Check results immediately
SELECT * FROM public._debug_notif_logs ORDER BY id DESC LIMIT 5;
SELECT id, status_code, created FROM net._http_response ORDER BY id DESC LIMIT 3;
