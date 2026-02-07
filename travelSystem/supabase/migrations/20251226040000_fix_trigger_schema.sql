-- Final Root Fix for Notification Trigger
-- This version uses the verified 'net' schema discovered in diagnostics

-- 1. Ensure pg_net is ready in 'net' schema
CREATE SCHEMA IF NOT EXISTS net;
-- We don't try to move it if it's already there to avoid errors
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
    CREATE EXTENSION pg_net WITH SCHEMA net;
  END IF;
END $$;

-- 2. Update the trigger function with the verified 'net.http_post'
CREATE OR REPLACE FUNCTION public.trigger_notification_dispatch()
RETURNS TRIGGER AS $$
DECLARE
  payload JSONB;
  request_id BIGINT;
  edge_function_url TEXT := 'https://kbgbftyvbdgyoeosxlok.supabase.co/functions/v1/notify';
  
  -- ✅ THIS IS YOUR SERVICE ROLE KEY (Put it here directly)
  service_key TEXT := 'sb_secret_-wrIOAgYYhubOJebPGn73A_rGdeWwgF'; 
BEGIN
  -- Construct the payload
  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'notification_id', NEW.notification_id,
    'user_id', NEW.user_id,
    'title', COALESCE(NEW.title, 'إشعار جديد'),
    'message', NEW.message,
    'notification_type', NEW.type,
    'sent_at', NEW.sent_at
  );

  -- Log attempt start
  RAISE NOTICE 'Attempting to send notification % via net.http_post', NEW.notification_id;

  -- Use net.http_post explicitly (Async)
  -- We include both apikey and Authorization headers to satisfy Supabase's auth gateway
  SELECT net.http_post(
    url := edge_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', service_key,
      'Authorization', 'Bearer ' || service_key
    ),
    body := payload
  ) INTO request_id;

  RAISE NOTICE 'Notification dispatch queued. Request ID: %', request_id;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Notification dispatch error: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-attach trigger
DROP TRIGGER IF EXISTS on_notification_added ON public.notifications;
CREATE TRIGGER on_notification_added
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_notification_dispatch();
