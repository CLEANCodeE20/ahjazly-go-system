-- ========================================================
-- NOTIFICATION CHECK: POST-CLEANUP VERIFICATION
-- ========================================================

-- 1. Verify only ONE trigger exists now
SELECT 
    tgname as trigger_name,
    proname as function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'notifications'
AND tgname NOT LIKE 'RI_%'; -- Exclude internal triggers

-- 2. Check the MOST RECENT response from the Edge Function
SELECT 
    id,
    status_code,
    error_msg,
    created as response_time,
    content as response_body
FROM net._http_response
ORDER BY id DESC
LIMIT 5;

-- 3. Check if any requests are stuck/pending
SELECT count(*) as pending_requests 
FROM net.http_request_queue;

-- 4. PERFORM A NEW MANUAL TEST
-- Run this if the list above is empty or old
-- INSERT INTO public.notifications (auth_id, title, message, type)
-- SELECT auth_id, 'Final Test', 'Checking end-to-end flow now', 'system'
-- FROM user_roles WHERE role = 'SUPERUSER' LIMIT 1;
