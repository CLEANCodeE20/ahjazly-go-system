-- ========================================================
-- DEBUG: HEADER VARIATIONS & LOG CHECK
-- ========================================================

-- 1. Check for any internal trigger errors
SELECT * FROM public._debug_notif_logs ORDER BY id DESC LIMIT 5;

-- 2. Test multiple header variations
DO $$
DECLARE
  v_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiZ2JmdHl2YmRneW9lb3N4bG9rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjU3MTExNywiZXhwIjoyMDgyMTQ3MTE3fQ.-oiIri8pTmxJATXAmyYU8K8sobTtI4e7kHGeqHX0mwoE';
BEGIN
  -- Variation A: Lowerecase authorization + apikey
  PERFORM net.http_post(
    url := 'https://kbgbftyvbdgyoeosxlok.supabase.co/functions/v1/notify',
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'authorization', 'Bearer ' || v_key,
      'apikey', v_key
    ),
    body := '{"test": "variation_A"}'::jsonb
  );
  
  -- Variation B: Only apikey
  PERFORM net.http_post(
    url := 'https://kbgbftyvbdgyoeosxlok.supabase.co/functions/v1/notify',
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'apikey', v_key
    ),
    body := '{"test": "variation_B"}'::jsonb
  );
END $$;

-- 3. Check for any new responses in a few seconds (User will run this)
SELECT id, status_code, created, substring(content from 1 for 100) as body
FROM net._http_response 
ORDER BY id DESC 
LIMIT 5;
