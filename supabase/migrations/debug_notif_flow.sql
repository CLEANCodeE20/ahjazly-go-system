-- ========================================================
-- DEBUG: WHY IS IT NOT SENDING?
-- ========================================================

-- 1. Check if the test notification actually exists in the DB
SELECT 
    notification_id, 
    title, 
    created_at, 
    auth_id 
FROM public.notifications 
ORDER BY notification_id DESC 
LIMIT 3;

-- 2. Check the raw status of pg_net worker
-- This tells us if the background worker is dead
SELECT * FROM net._http_response ORDER BY id DESC LIMIT 5;

-- 3. Check if there are any errors in the PG logs (simulated)
-- By checking if the function itself is valid
SELECT proname, proretset, provolatile, pronargs 
FROM pg_proc WHERE proname = 'handle_new_notification';
