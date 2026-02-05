-- Enhanced Notifications Webhook with Error Handling and Configuration
-- This triggers an Edge Function when a notification is inserted

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "extensions";

-- 2. Create improved function with error handling (using hardcoded URL)
CREATE OR REPLACE FUNCTION public.trigger_notification_dispatch()
RETURNS TRIGGER AS $$
DECLARE
  payload JSONB;
  response_id BIGINT;
  edge_function_url TEXT := 'https://kbgbftyvbdgyoeosxlok.supabase.co/functions/v1/notify';
BEGIN
  -- Construct the payload with more details
  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'notification_id', NEW.notification_id,
    'user_id', NEW.user_id,
    'title', NEW.title,
    'message', NEW.message,
    'notification_type', NEW.type,
    'priority', COALESCE(NEW.priority, 'medium'),
    'created_at', NEW.created_at
  );

  -- Make async HTTP request (non-blocking)
  -- Note: net.http_post is async by default, won't block the transaction
  SELECT net.http_post(
    url := edge_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := payload::text::jsonb
  ) INTO response_id;

  -- Log the request (optional, for debugging)
  -- You can check net._http_response table later with response_id
  RAISE LOG 'Notification webhook triggered: ID=%, Response=%', NEW.notification_id, response_id;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail the insert if webhook fails
    RAISE WARNING 'Failed to trigger notification webhook: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create the Trigger
DROP TRIGGER IF EXISTS on_notification_added ON public.notifications;
CREATE TRIGGER on_notification_added
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_notification_dispatch();

-- 5. Grant necessary permissions
GRANT USAGE ON SCHEMA net TO postgres, authenticated, service_role;

-- Add helpful comment
COMMENT ON FUNCTION public.trigger_notification_dispatch() IS 
  'Triggers Edge Function to dispatch notification via FCM/WhatsApp when new notification is inserted';
