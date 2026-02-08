-- ========================================================
-- DIAGNOSTIC: Trip Resource Validation Status
-- Date: 2026-02-08
-- Purpose: التحقق من حالة نظام التحقق من توفر الباصات والسائقين
-- ========================================================

-- 1. التحقق من وجود الدوال
SELECT 
    '1. Validation Functions Status' as check_name;

SELECT 
    p.proname as function_name,
    CASE 
        WHEN p.proname IS NOT NULL THEN '✓ Exists'
        ELSE '✗ Missing'
    END as status,
    pg_get_functiondef(p.oid) as definition_preview
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname IN ('check_bus_availability', 'check_driver_availability', 'validate_trip_resources')
ORDER BY p.proname;

-- 2. التحقق من وجود الـ Trigger
SELECT 
    '2. Trigger Status' as check_name;

SELECT 
    t.tgname as trigger_name,
    CASE 
        WHEN t.tgenabled = 'O' THEN '✓ Enabled'
        WHEN t.tgenabled = 'D' THEN '✗ Disabled'
        WHEN t.tgenabled = 'R' THEN '⚠ Replica Only'
        WHEN t.tgenabled = 'A' THEN '⚠ Always'
        ELSE '? Unknown'
    END as status,
    pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
AND c.relname = 'trips'
AND t.tgname = 'validate_trip_before_insert_or_update';

-- 3. اختبار بسيط: البحث عن رحلات متعارضة حالياً
SELECT 
    '3. Current Conflicting Trips' as check_name;

-- الباصات التي لديها أكثر من رحلة نشطة في نفس الوقت
SELECT 
    'Buses with Overlapping Trips' as issue_type,
    t1.bus_id,
    COUNT(*) as overlapping_trips_count,
    STRING_AGG(t1.trip_id::TEXT, ', ') as trip_ids
FROM public.trips t1
JOIN public.trips t2 ON t1.bus_id = t2.bus_id 
    AND t1.trip_id != t2.trip_id
    AND t1.status IN ('scheduled', 'in_progress')
    AND t2.status IN ('scheduled', 'in_progress')
    AND (t1.departure_time, COALESCE(t1.arrival_time, t1.departure_time + INTERVAL '24 hours')) 
        OVERLAPS 
        (t2.departure_time, COALESCE(t2.arrival_time, t2.departure_time + INTERVAL '24 hours'))
GROUP BY t1.bus_id
HAVING COUNT(*) > 0;

-- السائقون الذين لديهم أكثر من رحلة نشطة في نفس الوقت
SELECT 
    'Drivers with Overlapping Trips' as issue_type,
    t1.driver_id,
    COUNT(*) as overlapping_trips_count,
    STRING_AGG(t1.trip_id::TEXT, ', ') as trip_ids
FROM public.trips t1
JOIN public.trips t2 ON t1.driver_id = t2.driver_id 
    AND t1.trip_id != t2.trip_id
    AND t1.status IN ('scheduled', 'in_progress')
    AND t2.status IN ('scheduled', 'in_progress')
    AND (t1.departure_time, COALESCE(t1.arrival_time, t1.departure_time + INTERVAL '24 hours')) 
        OVERLAPS 
        (t2.departure_time, COALESCE(t2.arrival_time, t2.departure_time + INTERVAL '24 hours'))
GROUP BY t1.driver_id
HAVING COUNT(*) > 0;

-- 4. عرض تفاصيل الرحلات المتعارضة
SELECT 
    '4. Detailed Conflicting Trips' as check_name;

SELECT 
    t.trip_id,
    t.bus_id,
    t.driver_id,
    t.departure_time,
    t.arrival_time,
    t.status,
    r.origin_city || ' → ' || r.destination_city as route
FROM public.trips t
LEFT JOIN public.routes r ON t.route_id = r.route_id
WHERE t.status IN ('scheduled', 'in_progress')
AND (
    -- الباصات المتعارضة
    t.bus_id IN (
        SELECT t1.bus_id
        FROM public.trips t1
        JOIN public.trips t2 ON t1.bus_id = t2.bus_id 
            AND t1.trip_id != t2.trip_id
            AND t1.status IN ('scheduled', 'in_progress')
            AND t2.status IN ('scheduled', 'in_progress')
            AND (t1.departure_time, COALESCE(t1.arrival_time, t1.departure_time + INTERVAL '24 hours')) 
                OVERLAPS 
                (t2.departure_time, COALESCE(t2.arrival_time, t2.departure_time + INTERVAL '24 hours'))
    )
    OR
    -- السائقون المتعارضون
    t.driver_id IN (
        SELECT t1.driver_id
        FROM public.trips t1
        JOIN public.trips t2 ON t1.driver_id = t2.driver_id 
            AND t1.trip_id != t2.trip_id
            AND t1.status IN ('scheduled', 'in_progress')
            AND t2.status IN ('scheduled', 'in_progress')
            AND (t1.departure_time, COALESCE(t1.arrival_time, t1.departure_time + INTERVAL '24 hours')) 
                OVERLAPS 
                (t2.departure_time, COALESCE(t2.arrival_time, t2.departure_time + INTERVAL '24 hours'))
    )
)
ORDER BY t.bus_id, t.driver_id, t.departure_time;

-- 5. اختبار الدوال يدوياً
SELECT 
    '5. Manual Function Test' as check_name;

-- اختبار دالة التحقق من توفر الباص
DO $$
DECLARE
    v_test_bus_id BIGINT;
    v_test_departure TIMESTAMP;
    v_test_arrival TIMESTAMP;
    v_result BOOLEAN;
BEGIN
    -- الحصول على أول باص لديه رحلة نشطة
    SELECT bus_id, departure_time, arrival_time 
    INTO v_test_bus_id, v_test_departure, v_test_arrival
    FROM public.trips
    WHERE status IN ('scheduled', 'in_progress')
    AND bus_id IS NOT NULL
    LIMIT 1;
    
    IF v_test_bus_id IS NOT NULL THEN
        -- محاولة التحقق من توفر الباص في نفس الوقت (يجب أن يرجع FALSE)
        v_result := public.check_bus_availability(
            v_test_bus_id,
            v_test_departure,
            COALESCE(v_test_arrival, v_test_departure + INTERVAL '2 hours')
        );
        
        RAISE NOTICE 'Test: Bus % availability during existing trip = % (Expected: FALSE)', 
            v_test_bus_id, v_result;
    ELSE
        RAISE NOTICE 'No active trips found for testing';
    END IF;
END $$;

-- 6. الملخص النهائي
SELECT 
    '6. System Health Summary' as check_name;

SELECT 
    CASE 
        WHEN NOT EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' 
            AND p.proname = 'validate_trip_resources'
        )
        THEN '🔴 CRITICAL: Validation function missing'
        
        WHEN NOT EXISTS (
            SELECT 1 FROM pg_trigger t
            JOIN pg_class c ON t.tgrelid = c.oid
            JOIN pg_namespace n ON c.relnamespace = n.oid
            WHERE n.nspname = 'public'
            AND c.relname = 'trips'
            AND t.tgname = 'validate_trip_before_insert_or_update'
            AND t.tgenabled = 'O'
        )
        THEN '🔴 CRITICAL: Trigger missing or disabled'
        
        WHEN EXISTS (
            SELECT 1 FROM public.trips t1
            JOIN public.trips t2 ON t1.bus_id = t2.bus_id 
                AND t1.trip_id != t2.trip_id
                AND t1.status IN ('scheduled', 'in_progress')
                AND t2.status IN ('scheduled', 'in_progress')
                AND (t1.departure_time, COALESCE(t1.arrival_time, t1.departure_time + INTERVAL '24 hours')) 
                    OVERLAPS 
                    (t2.departure_time, COALESCE(t2.arrival_time, t2.departure_time + INTERVAL '24 hours'))
        )
        THEN '⚠️ WARNING: Conflicting trips detected - Validation not working properly'
        
        ELSE '✅ SYSTEM HEALTHY: Validation system active and working'
    END as system_status;
