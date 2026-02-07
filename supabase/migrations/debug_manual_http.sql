-- ========================================================
-- DEBUG: MANUAL HTTP TEST & TRIGGER AUDIT
-- ========================================================

-- 1. Test if http_post works MANUALLY from SQL
-- Replace the key with the one used in the trigger
DO $$
DECLARE
  v_res_id BIGINT;
  v_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiZ2JmdHl2YmRneW9lb3N4bG9rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjU3MTExNywiZXhwIjoyMDgyMTQ3MTE3fQ.-oiIri8pTmxJATXAmyYU8K8sobTtI4e7kHGeqHX0mwoE';
BEGIN
  v_res_id := net.http_post(
    url := 'https://kbgbftyvbdgyoeosxlok.supabase.co/functions/v1/notify',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body := '{"test": "manual_sql_call"}'::jsonb
  );
  RAISE NOTICE 'Manual HTTP Post Queued with ID: %', v_res_id;
END $$;

-- 2. Verify EXACT trigger details
SELECT 
    tgname as trigger_name,
    tgenabled as is_enabled,
    tgtype as trigger_type_code,
    (SELECT proname FROM pg_proc WHERE oid = tgfoid) as function_name
FROM pg_trigger 
WHERE tgrelid = 'public.notifications'::regclass
AND tgname NOT LIKE 'RI_%';
