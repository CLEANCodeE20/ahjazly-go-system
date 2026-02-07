-- ========================================================
-- DEBUG: WHY IS IT NOT SENDING? (FIXED SCHEMA)
-- ========================================================

-- 1. Check if the test notification actually exists in the DB
SELECT 
    notification_id, 
    title, 
    sent_at, 
    auth_id 
FROM public.notifications 
ORDER BY notification_id DESC 
LIMIT 5;

-- 2. Check the raw status of pg_net responses (Verified columns)
SELECT 
    id,
    status_code,
    error_msg,
    created as response_time,
    substring(content from 1 for 100) as body_preview
FROM net._http_response 
ORDER BY id DESC 
LIMIT 5;

-- 3. Check for pending requests
SELECT count(*) as pending FROM net.http_request_queue;
