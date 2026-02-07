-- ========================================================
-- DEEP DIAGNOSTIC: NOTIFICATION & EMAIL TRIGGER
-- ========================================================

-- 1. Check Extensions
SELECT name, default_version, installed_version 
FROM pg_available_extensions 
WHERE name IN ('http', 'pg_net');

-- 2. Check Trigger Existence
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'notifications';

-- 3. TEST: Insert a dummy notification
DO $$
DECLARE
  v_auth_id UUID;
  v_notif_id BIGINT;
BEGIN
  -- Get SUPERUSER auth_id
  SELECT auth_id INTO v_auth_id FROM user_roles WHERE role = 'SUPERUSER' LIMIT 1;
  
  IF v_auth_id IS NOT NULL THEN
    INSERT INTO public.notifications (
      auth_id,
      title,
      message,
      type,
      priority,
      metadata
    ) VALUES (
      v_auth_id,
      'Test Email Trigger',
      'This is a test notification to verify Edge Function trigger. Time: ' || now(),
      'system',
      'high',
      json_build_object('test', true)
    ) RETURNING notification_id INTO v_notif_id;
    
    RAISE NOTICE 'Test notification inserted with ID: %', v_notif_id;
  ELSE
    RAISE NOTICE 'No SUPERUSER found for test.';
  END IF;
END $$;

-- 4. Check if HTTP Request was queued (pg_net)
SELECT * FROM net.http_request_queue LIMIT 5;
