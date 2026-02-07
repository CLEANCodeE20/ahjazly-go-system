-- ========================================================
-- NOTIFICATION DIAGNOSTIC (STRICT)
-- ========================================================

-- 1. Check Trigger
SELECT trigger_name, action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'notifications';

-- 2. Check Queue and Responses
-- This will tell us if Authorization is still null or if the Edge Function responded with an error
SELECT 
    id,
    method,
    url,
    headers->>'Authorization' as auth_header,
    response_status_code,
    response_body,
    error_msg
FROM net.http_request_queue
ORDER BY id DESC
LIMIT 5;

-- 3. Check for any recent logs in messages (NOTICE)
-- Run a test insert again to see immediate feedback
DO $$
DECLARE
  v_auth_id UUID;
BEGIN
  SELECT auth_id INTO v_auth_id FROM user_roles WHERE role = 'SUPERUSER' LIMIT 1;
  IF v_auth_id IS NOT NULL THEN
    INSERT INTO public.notifications (auth_id, title, message, type)
    VALUES (v_auth_id, 'Diagnostic Test', 'Testing if trigger works with Auth', 'system');
  END IF;
END $$;
