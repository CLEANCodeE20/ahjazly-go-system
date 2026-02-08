-- ========================================================
-- VERIFY: Trip Launch Automation Status
-- Date: 2026-02-08
-- Purpose: التحقق من عمل نظام إطلاق الرحلات التلقائي
-- ========================================================

-- 1. التحقق من تثبيت pg_cron
SELECT 
    '1. pg_cron Extension' as check_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') 
        THEN '✓ Installed and Active' 
        ELSE '✗ NOT Installed - CRITICAL ISSUE' 
    END as status;

-- 2. التحقق من وجود الدالة
SELECT 
    '2. Automation Function' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' 
            AND p.proname = 'process_trip_scheduled_actions'
        ) 
        THEN '✓ Function Exists' 
        ELSE '✗ Function NOT Found - CRITICAL ISSUE' 
    END as status;

-- 3. عرض الوظائف المجدولة النشطة
SELECT 
    '3. Scheduled Cron Jobs' as check_name;
    
SELECT 
    jobid,
    jobname,
    schedule,
    active,
    CASE 
        WHEN active THEN '✓ Active'
        ELSE '✗ Inactive - CRITICAL ISSUE'
    END as job_status,
    command
FROM cron.job
WHERE jobname = 'process-trips-job';

-- 4. آخر 5 عمليات تنفيذ للوظيفة
SELECT 
    '4. Recent Job Executions' as check_name;
    
SELECT 
    runid,
    job_pid,
    status,
    CASE 
        WHEN status = 'succeeded' THEN '✓'
        WHEN status = 'failed' THEN '✗'
        ELSE '⚠'
    END as result_icon,
    return_message,
    start_time,
    end_time,
    (end_time - start_time) as duration
FROM cron.job_run_details
WHERE jobid IN (SELECT jobid FROM cron.job WHERE jobname = 'process-trips-job')
ORDER BY start_time DESC
LIMIT 5;

-- 5. الرحلات التي يجب أن تكون قيد التنفيذ الآن
SELECT 
    '5. Trips That Should Be In Progress' as check_name;
    
SELECT 
    trip_id,
    departure_time,
    status,
    (NOW() - departure_time) as time_since_departure,
    CASE 
        WHEN departure_time <= NOW() AND status = 'scheduled'
        THEN '⚠️ SHOULD BE IN_PROGRESS - Automation Not Working!'
        WHEN departure_time <= NOW() AND status = 'in_progress'
        THEN '✓ Correct Status'
        ELSE '✓ Future Trip'
    END as automation_status
FROM public.trips
WHERE status IN ('scheduled', 'in_progress')
  AND departure_time <= NOW() + INTERVAL '1 hour'
ORDER BY departure_time;

-- 6. الرحلات المجدولة القادمة (التي ستنطلق قريباً)
SELECT 
    '6. Upcoming Scheduled Trips (Next 24 Hours)' as check_name;
    
SELECT 
    trip_id,
    departure_time,
    status,
    (departure_time - NOW()) as time_until_departure,
    CASE 
        WHEN (departure_time - NOW()) <= INTERVAL '15 minutes'
        THEN '⏰ Launching Very Soon'
        WHEN (departure_time - NOW()) <= INTERVAL '30 minutes'
        THEN '⏰ Launching Soon'
        WHEN (departure_time - NOW()) <= INTERVAL '1 hour'
        THEN '📅 Launching Within Hour'
        ELSE '📅 Scheduled'
    END as launch_status
FROM public.trips
WHERE status = 'scheduled'
  AND departure_time > NOW()
  AND departure_time <= NOW() + INTERVAL '24 hours'
ORDER BY departure_time
LIMIT 10;

-- 7. إحصائيات الرحلات حسب الحالة
SELECT 
    '7. Trip Status Statistics' as check_name;
    
SELECT 
    status,
    COUNT(*) as count,
    CASE status
        WHEN 'scheduled' THEN '📅'
        WHEN 'in_progress' THEN '🚌'
        WHEN 'completed' THEN '✓'
        WHEN 'cancelled' THEN '✗'
        WHEN 'delayed' THEN '⚠'
    END as icon
FROM public.trips
WHERE departure_time >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY status
ORDER BY 
    CASE status
        WHEN 'in_progress' THEN 1
        WHEN 'scheduled' THEN 2
        WHEN 'delayed' THEN 3
        WHEN 'completed' THEN 4
        WHEN 'cancelled' THEN 5
    END;

-- 8. التحقق من الإشعارات المرسلة مؤخراً
SELECT 
    '8. Recent Trip Notifications' as check_name;
    
SELECT 
    notification_id,
    title,
    created_at,
    priority,
    is_read,
    CASE 
        WHEN is_read THEN '✓ Read'
        ELSE '📬 Unread'
    END as read_status
FROM public.notifications
WHERE type = 'trip'
  AND created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 10;

-- 9. ملخص الحالة العامة
SELECT 
    '9. Overall System Health' as check_name;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron')
         AND EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-trips-job' AND active = true)
         AND NOT EXISTS (
             SELECT 1 FROM public.trips 
             WHERE status = 'scheduled' 
             AND departure_time <= NOW() - INTERVAL '5 minutes'
         )
        THEN '✅ SYSTEM HEALTHY - Automation Working Correctly'
        WHEN NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron')
        THEN '🔴 CRITICAL: pg_cron Not Installed'
        WHEN NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-trips-job' AND active = true)
        THEN '🔴 CRITICAL: Cron Job Not Active'
        WHEN EXISTS (
             SELECT 1 FROM public.trips 
             WHERE status = 'scheduled' 
             AND departure_time <= NOW() - INTERVAL '5 minutes'
         )
        THEN '⚠️ WARNING: Delayed Trips Detected - Automation May Not Be Working'
        ELSE '⚠️ UNKNOWN STATUS'
    END as system_status;
