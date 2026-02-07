-- ========================================================
-- COMBINED NOTIFICATION DIAGNOSTIC (SINGLE VIEW)
-- ========================================================

WITH latest_response AS (
    SELECT 
        status_code, 
        substring(content from 1 for 100) as body_preview, 
        created 
    FROM net._http_response 
    ORDER BY id DESC LIMIT 1
),
trigger_count AS (
    SELECT count(*) as total_triggers
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE c.relname = 'notifications' AND tgname NOT LIKE 'RI_%'
),
pending AS (
    SELECT count(*) as total_pending FROM net.http_request_queue
)
SELECT 
    (SELECT total_triggers FROM trigger_count) as triggers_active,
    (SELECT total_pending FROM pending) as queue_size,
    (SELECT status_code FROM latest_response) as last_status,
    (SELECT body_preview FROM latest_response) as last_response_text,
    (SELECT created FROM latest_response) as last_attempt_time;
