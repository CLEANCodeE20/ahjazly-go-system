-- 1. Check enum values
SELECT enum_range(NULL::notification_type);

-- 2. Try to insert a dummy notification (simulate the trigger)
DO $$
DECLARE
  v_auth_id UUID;
BEGIN
  -- Get first SUPERUSER auth_id
  SELECT auth_id INTO v_auth_id 
  FROM user_roles 
  WHERE role = 'SUPERUSER' 
  LIMIT 1;

  IF v_auth_id IS NOT NULL THEN
    INSERT INTO public.notifications (
      auth_id,
      title,
      message,
      type,
      priority,
      action_url,
      metadata
    ) VALUES (
      v_auth_id,
      'Test Title',
      'Test Message',
      'system',
      'high',
      '/test-url',
      '{}'::jsonb
    );
    RAISE NOTICE 'Notification inserted successfully';
  ELSE
    RAISE NOTICE 'No SUPERUSER found to test notification';
  END IF;
END $$;
