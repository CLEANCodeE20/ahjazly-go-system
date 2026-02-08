-- ========================================================
-- COMPREHENSIVE SYSTEM VERIFICATION
-- Date: 2026-02-08
-- Purpose: التحقق النهائي من إصلاح المشكلتين (إطلاق الرحلات + تعارض الموارد)
-- ========================================================

-- 1. التحقق من نظام إطلاق الرحلات (Automation)
SELECT 
    '1. Trip Launch Automation Status' as check_section;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') 
        THEN '✓ pg_cron Installed' 
        ELSE '✗ pg_cron MISSING' 
    END as cron_extension,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-trips-job' AND active = true)
        THEN '✓ Job Scheduled & Active'
        ELSE '✗ Job NOT Scheduled or Inactive'
    END as cron_job,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'process_trip_scheduled_actions')
        THEN '✓ Function Exists'
        ELSE '✗ Function MISSING'
    END as automation_function;

-- 2. التحقق من نظام منع التعارض (Validation)
SELECT 
    '2. Resource Validation Status' as check_section;

SELECT 
    tgname as trigger_name,
    CASE 
        WHEN tgenabled = 'O' THEN '✓ Enabled (Origin)'
        WHEN tgenabled = 'D' THEN '✗ Disabled'
        ELSE '⚠ Unknown State'
    END as status,
    pg_get_triggerdef(oid) as definition
FROM pg_trigger
WHERE tgname = 'validate_trip_before_insert_or_update';

-- 3. التحقق من الدوال الأساسية للتحقق
SELECT 
    proname as function_name,
    '✓ Exists' as status
FROM pg_proc
WHERE proname IN ('check_bus_availability', 'check_driver_availability', 'get_conflicting_trips')
ORDER BY proname;

-- 4. تجربة عملية سريعة (محاكاة فقط)
SELECT 
    '3. Quick Simulated Test' as check_section;

DO $$
DECLARE
    v_bus_id BIGINT;
    v_driver_id BIGINT;
    v_trip_id BIGINT;
BEGIN
    -- محاولة العثور على رحلة نشطة للاختبار
    SELECT bus_id, driver_id, trip_id INTO v_bus_id, v_driver_id, v_trip_id
    FROM trips 
    WHERE status IN ('scheduled', 'in_progress') 
    LIMIT 1;
    
    IF v_bus_id IS NOT NULL THEN
        RAISE NOTICE 'Found active trip #% with Bus % and Driver %', v_trip_id, v_bus_id, v_driver_id;
        
        -- التحقق من الدالة مباشرة
        PERFORM check_bus_availability(v_bus_id, NOW(), NOW() + INTERVAL '1 hour', NULL);
        -- إذا وصلنا هنا بدون خطأ، فهذا يعني أن الدالة تعمل (لكنها قد ترجع FALSE أو TRUE حسب الحالة)
        -- الدالة check_bus_availability ترجع BOOLEAN ولا ترفع استثناء إلا في حالة الخطأ النظامي
        
        RAISE NOTICE '✓ Validation functions are callable';
    ELSE
        RAISE NOTICE '⚠ No active trips found to test against, but functions exist';
    END IF;
END $$;
