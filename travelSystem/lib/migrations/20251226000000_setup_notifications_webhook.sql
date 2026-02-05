-- 1. Enable the HTTP extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "extensions";

-- 2. Create the function to call the local/remote Edge Function
CREATE OR REPLACE FUNCTION public.trigger_notification_dispatch()
RETURNS TRIGGER AS $$
DECLARE
  payload JSONB;
BEGIN
  -- Construct the payload
  payload := json_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'record', row_to_json(NEW)
  );

  -- Call the Supabase Edge Function
  -- Replace <PROJECT_REF> with your actual project reference
  -- And ensure you have set the SERVICE_ROLE_KEY in the headers if needed
  PERFORM
    net.http_post(
      url := 'https://kbgbftyvbdgyoeosxlok.supabase.co/functions/v1/notify',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := payload
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the Trigger
DROP TRIGGER IF EXISTS on_notification_added ON public.notifications;
CREATE TRIGGER on_notification_added
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_notification_dispatch();
