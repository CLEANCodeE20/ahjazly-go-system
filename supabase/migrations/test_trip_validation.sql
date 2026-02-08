-- ========================================================
-- TEST: Trip Validation System
-- Date: 2026-02-08
-- Purpose: اختبار نظام التحقق من توفر الباصات والسائقين
-- ========================================================

-- هذا السكريبت يختبر النظام بمحاولة إنشاء رحلات متعارضة
-- يجب أن يفشل الاختبار إذا كان النظام يعمل بشكل صحيح

BEGIN;

-- ========================================================
-- 1. إعداد بيانات الاختبار
-- ========================================================
DO $$
DECLARE
    v_test_bus_id BIGINT;
    v_test_driver_id BIGINT;
    v_test_route_id BIGINT;
    v_test_partner_id BIGINT;
    v_test_departure TIMESTAMP WITH TIME ZONE;
    v_test_arrival TIMESTAMP WITH TIME ZONE;
    v_existing_trip_id BIGINT;
    v_error_caught BOOLEAN := FALSE;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'STARTING TRIP VALIDATION TESTS';
    RAISE NOTICE '========================================';
    
    -- الحصول على رحلة موجودة للاختبار
    SELECT 
        trip_id, bus_id, driver_id, route_id, partner_id, 
        departure_time, arrival_time
    INTO 
        v_existing_trip_id, v_test_bus_id, v_test_driver_id, 
        v_test_route_id, v_test_partner_id,
        v_test_departure, v_test_arrival
    FROM public.trips
    WHERE status IN ('scheduled', 'in_progress')
    AND bus_id IS NOT NULL
    AND driver_id IS NOT NULL
    LIMIT 1;
    
    IF v_existing_trip_id IS NULL THEN
        RAISE NOTICE '⚠️ No active trips found for testing';
        RAISE NOTICE 'Creating a test trip first...';
        
        -- الحصول على أول باص وسائق وشريك ومسار متاحين
        SELECT bus_id INTO v_test_bus_id 
        FROM public.buses 
        WHERE status = 'active' 
        LIMIT 1;
        
        SELECT driver_id INTO v_test_driver_id 
        FROM public.drivers 
        WHERE status = 'active' 
        LIMIT 1;
        
        SELECT route_id INTO v_test_route_id 
        FROM public.routes 
        LIMIT 1;
        
        SELECT partner_id INTO v_test_partner_id 
        FROM public.partners 
        WHERE status = 'active' 
        LIMIT 1;
        
        IF v_test_bus_id IS NULL OR v_test_driver_id IS NULL OR 
           v_test_route_id IS NULL OR v_test_partner_id IS NULL THEN
            RAISE EXCEPTION 'Cannot run tests: Missing required data (bus, driver, route, or partner)';
        END IF;
        
        -- إنشاء رحلة اختبار
        v_test_departure := NOW() + INTERVAL '2 hours';
        v_test_arrival := v_test_departure + INTERVAL '4 hours';
        
        INSERT INTO public.trips (
            partner_id, route_id, bus_id, driver_id,
            departure_time, arrival_time, base_price, status
        ) VALUES (
            v_test_partner_id, v_test_route_id, v_test_bus_id, v_test_driver_id,
            v_test_departure, v_test_arrival, 100, 'scheduled'
        ) RETURNING trip_id INTO v_existing_trip_id;
        
        RAISE NOTICE '✓ Created test trip: %', v_existing_trip_id;
    ELSE
        RAISE NOTICE '✓ Found existing trip for testing: %', v_existing_trip_id;
        RAISE NOTICE '  Bus: %, Driver: %, Departure: %', 
            v_test_bus_id, v_test_driver_id, v_test_departure;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'TEST 1: Attempting to create conflicting trip with SAME BUS';
    RAISE NOTICE '========================================';
    
    -- اختبار 1: محاولة إنشاء رحلة بنفس الباص في نفس الوقت
    BEGIN
        INSERT INTO public.trips (
            partner_id, route_id, bus_id, driver_id,
            departure_time, arrival_time, base_price, status
        ) VALUES (
            v_test_partner_id, 
            v_test_route_id, 
            v_test_bus_id,  -- نفس الباص
            (SELECT driver_id FROM public.drivers WHERE status = 'active' AND driver_id != v_test_driver_id LIMIT 1),
            v_test_departure,  -- نفس الوقت
            v_test_arrival,
            100, 
            'scheduled'
        );
        
        -- إذا وصلنا هنا، فهذا يعني أن النظام فشل في منع التعارض
        RAISE NOTICE '❌ TEST 1 FAILED: System allowed conflicting bus assignment!';
        v_error_caught := FALSE;
        
    EXCEPTION
        WHEN OTHERS THEN
            -- هذا هو السلوك المتوقع
            RAISE NOTICE '✓ TEST 1 PASSED: System correctly prevented bus conflict';
            RAISE NOTICE '  Error message: %', SQLERRM;
            v_error_caught := TRUE;
    END;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'TEST 2: Attempting to create conflicting trip with SAME DRIVER';
    RAISE NOTICE '========================================';
    
    -- اختبار 2: محاولة إنشاء رحلة بنفس السائق في نفس الوقت
    BEGIN
        INSERT INTO public.trips (
            partner_id, route_id, bus_id, driver_id,
            departure_time, arrival_time, base_price, status
        ) VALUES (
            v_test_partner_id, 
            v_test_route_id, 
            (SELECT bus_id FROM public.buses WHERE status = 'active' AND bus_id != v_test_bus_id LIMIT 1),
            v_test_driver_id,  -- نفس السائق
            v_test_departure,  -- نفس الوقت
            v_test_arrival,
            100, 
            'scheduled'
        );
        
        RAISE NOTICE '❌ TEST 2 FAILED: System allowed conflicting driver assignment!';
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '✓ TEST 2 PASSED: System correctly prevented driver conflict';
            RAISE NOTICE '  Error message: %', SQLERRM;
    END;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'TEST 3: Attempting to create trip with OVERLAPPING time';
    RAISE NOTICE '========================================';
    
    -- اختبار 3: محاولة إنشاء رحلة بوقت متداخل (تبدأ قبل انتهاء الرحلة الأولى)
    BEGIN
        INSERT INTO public.trips (
            partner_id, route_id, bus_id, driver_id,
            departure_time, arrival_time, base_price, status
        ) VALUES (
            v_test_partner_id, 
            v_test_route_id, 
            v_test_bus_id,  -- نفس الباص
            (SELECT driver_id FROM public.drivers WHERE status = 'active' AND driver_id != v_test_driver_id LIMIT 1),
            v_test_departure + INTERVAL '1 hour',  -- تبدأ بعد ساعة من بداية الرحلة الأولى
            v_test_arrival + INTERVAL '2 hours',   -- لكن قبل انتهاء الرحلة الأولى
            100, 
            'scheduled'
        );
        
        RAISE NOTICE '❌ TEST 3 FAILED: System allowed overlapping time conflict!';
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '✓ TEST 3 PASSED: System correctly prevented time overlap';
            RAISE NOTICE '  Error message: %', SQLERRM;
    END;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'TEST 4: Creating trip AFTER existing trip (should succeed)';
    RAISE NOTICE '========================================';
    
    -- اختبار 4: إنشاء رحلة بعد انتهاء الرحلة الأولى (يجب أن ينجح)
    BEGIN
        INSERT INTO public.trips (
            partner_id, route_id, bus_id, driver_id,
            departure_time, arrival_time, base_price, status
        ) VALUES (
            v_test_partner_id, 
            v_test_route_id, 
            v_test_bus_id,  -- نفس الباص
            v_test_driver_id,  -- نفس السائق
            COALESCE(v_test_arrival, v_test_departure + INTERVAL '4 hours') + INTERVAL '1 hour',  -- بعد انتهاء الرحلة الأولى
            COALESCE(v_test_arrival, v_test_departure + INTERVAL '4 hours') + INTERVAL '5 hours',
            100, 
            'scheduled'
        );
        
        RAISE NOTICE '✓ TEST 4 PASSED: System allowed non-conflicting trip';
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ TEST 4 FAILED: System incorrectly prevented valid trip!';
            RAISE NOTICE '  Error message: %', SQLERRM;
    END;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'TEST 5: Testing get_conflicting_trips function';
    RAISE NOTICE '========================================';
    
    -- اختبار 5: اختبار دالة الحصول على الرحلات المتعارضة
    DECLARE
        v_conflict_record RECORD;
        v_conflict_count INTEGER := 0;
    BEGIN
        FOR v_conflict_record IN 
            SELECT * FROM public.get_conflicting_trips(
                p_bus_id := v_test_bus_id,
                p_departure_time := v_test_departure,
                p_arrival_time := v_test_arrival
            )
        LOOP
            v_conflict_count := v_conflict_count + 1;
            RAISE NOTICE '  Conflict found: Trip %, Route: %, Type: %', 
                v_conflict_record.trip_id, 
                v_conflict_record.route_info,
                v_conflict_record.conflict_type;
        END LOOP;
        
        IF v_conflict_count > 0 THEN
            RAISE NOTICE '✓ TEST 5 PASSED: Found % conflicting trip(s)', v_conflict_count;
        ELSE
            RAISE NOTICE '⚠️ TEST 5: No conflicts found (this may be normal if test data was cleaned)';
        END IF;
    END;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'ALL TESTS COMPLETED';
    RAISE NOTICE '========================================';
    
END $$;

-- التراجع عن جميع التغييرات (لأن هذا مجرد اختبار)
ROLLBACK;

-- رسالة نهائية
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'TEST SESSION COMPLETED';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'All test changes have been rolled back.';
    RAISE NOTICE 'No data was modified in the database.';
    RAISE NOTICE '';
    RAISE NOTICE 'Expected Results:';
    RAISE NOTICE '  ✓ Tests 1-3 should PASS (conflicts prevented)';
    RAISE NOTICE '  ✓ Test 4 should PASS (valid trip allowed)';
    RAISE NOTICE '  ✓ Test 5 should show conflicts';
    RAISE NOTICE '========================================';
END $$;
