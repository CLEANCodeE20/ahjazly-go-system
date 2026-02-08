-- فحص حالة pg_cron والوظائف المجدولة
-- ========================================

-- 1. التحقق من تثبيت pg_cron
SELECT 
    'pg_cron Extension Status' as check_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') 
        THEN '✓ Installed' 
        ELSE '✗ NOT Installed' 
    END as status;

-- 2. عرض جميع الوظائف المجدولة
SELECT 
    'Scheduled Jobs' as check_name;
    
SELECT 
    jobid,
    schedule,
    command,
    nodename,
    nodeport,
    database,
    username,
    active,
    jobname
FROM cron.job
WHERE jobname LIKE '%trip%' OR command LIKE '%trip%';

-- 3. فحص آخر تنفيذ للوظائف
SELECT 
    'Recent Job Runs' as check_name;
    
SELECT 
    runid,
    jobid,
    job_pid,
    database,
    username,
    command,
    status,
    return_message,
    start_time,
    end_time
FROM cron.job_run_details
WHERE command LIKE '%trip%'
ORDER BY start_time DESC
LIMIT 10;

-- 4. فحص وجود الدالة process_trip_scheduled_actions
SELECT 
    'Function Exists' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' 
            AND p.proname = 'process_trip_scheduled_actions'
        ) 
        THEN '✓ Function Exists' 
        ELSE '✗ Function NOT Found' 
    END as status;

-- 5. فحص الرحلات التي يجب أن تكون قيد التنفيذ
SELECT 
    'Trips That Should Be In Progress' as check_name;
    
SELECT 
    trip_id,
    departure_time,
    status,
    CASE 
        WHEN departure_time <= NOW() + INTERVAL '2 minutes' AND status = 'scheduled'
        THEN '⚠️ Should be in_progress'
        ELSE '✓ Status OK'
    END as expected_status
FROM public.trips
WHERE status = 'scheduled'
  AND departure_time <= NOW() + INTERVAL '1 hour'
ORDER BY departure_time;

-- 6. فحص الرحلات المجدولة القادمة
SELECT 
    'Upcoming Scheduled Trips' as check_name;
    
SELECT 
    trip_id,
    departure_time,
    arrival_time,
    status,
    (departure_time - NOW()) as time_until_departure
FROM public.trips
WHERE status = 'scheduled'
  AND departure_time > NOW()
ORDER BY departure_time
LIMIT 5;
