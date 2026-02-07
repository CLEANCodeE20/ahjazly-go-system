-- ========================================================
-- SUPER DIAGNOSTIC (ALL IN ONE TABLE)
-- ========================================================

WITH last_notif AS (
    SELECT notification_id, title, sent_at, auth_id 
    FROM public.notifications ORDER BY notification_id DESC LIMIT 1
),
last_resp AS (
    SELECT id as resp_id, status_code, created, substring(content from 1 for 100) as body
    FROM net._http_response ORDER BY id DESC LIMIT 1
)
SELECT 
    (SELECT notification_id FROM last_notif) as DB_NOTIF_ID,
    (SELECT title FROM last_notif) as DB_NOTIF_TITLE,
    (SELECT sent_at FROM last_notif) as DB_SENT_AT,
    (SELECT resp_id FROM last_resp) as NET_RESP_ID,
    (SELECT status_code FROM last_resp) as NET_STATUS,
    (SELECT created FROM last_resp) as NET_TIME,
    (SELECT body FROM last_resp) as NET_BODY
;
