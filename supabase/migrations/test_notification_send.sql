-- ========================================================
-- TEST NOTIFICATION SCRIPT
-- ========================================================

DO $$
DECLARE
  v_auth_id UUID;
  v_notif_id BIGINT;
BEGIN
  -- 1. Get a valid auth_id (Superuser or any active user)
  SELECT auth_id INTO v_auth_id 
  FROM public.users 
  LIMIT 1;

  IF v_auth_id IS NULL THEN
    RAISE EXCEPTION 'No user found in public.users table to send test notification.';
  END IF;

  -- 2. Insert the notification
  -- This will trigger handle_new_notification()
  INSERT INTO public.notifications (
    auth_id,
    title,
    message,
    type,
    priority,
    metadata
  ) VALUES (
    v_auth_id,
    'تجربة إرسال إشعار 🚀',
    'هذا إشعار تجريبي للتأكد من ربط قاعدة البيانات مع الـ Edge Function ووصول الإيميل. الوقت: ' || now(),
    'system',
    'high',
    json_build_object('test_run', true)
  ) RETURNING notification_id INTO v_notif_id;

  RAISE NOTICE '✅ Success! Test notification inserted with ID: %', v_notif_id;
  RAISE NOTICE '👉 Now check the results in net._http_response table.';
END $$;
