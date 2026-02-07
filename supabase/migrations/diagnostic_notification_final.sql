-- ========================================================
-- FINAL NOTIFICATION DIAGNOSTIC (VERIFIED SCHEMA)
-- ========================================================

-- 1. Check recent responses (This tells us what actually happened)
SELECT 
    id,
    status_code,
    error_msg,
    timed_out,
    created as response_time,
    content as response_body
FROM net._http_response
ORDER BY created DESC
LIMIT 10;

-- 2. Check the pending queue
SELECT 
    id,
    method,
    url,
    headers->>'Authorization' as auth_header_summary
FROM net.http_request_queue
ORDER BY id DESC
LIMIT 5;

-- 3. Run a Fresh Test if needed
-- INSERT INTO public.notifications (auth_id, title, message, type)
-- SELECT auth_id, 'Deep Test', 'Verify if this generates a row in _http_response', 'system'
-- FROM user_roles WHERE role = 'SUPERUSER' LIMIT 1;
