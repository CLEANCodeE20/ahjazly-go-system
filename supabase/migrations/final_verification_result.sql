-- ========================================================
-- FINAL VERIFICATION (Fixed Ambiguity)
-- ========================================================
-- هذا السكريبت سيتحقق من حالة النظام ويرجع جدول نتائج واضح

BEGIN;

CREATE OR REPLACE FUNCTION public.check_all_system()
RETURNS TABLE(component TEXT, result_status TEXT, details TEXT) -- تم تغيير اسم العمود إلى result_status لتجنب التعارض
LANGUAGE plpgsql AS $$
DECLARE
    v_conflicting_bus BIGINT;
    v_conflicting_driver BIGINT;
    v_test_depart TIMESTAMP WITH TIME ZONE;
    v_bus_result BOOLEAN;
    v_driver_result BOOLEAN;
BEGIN
    -- 1. Automation System
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        RETURN QUERY SELECT 'Automation System', 'PASS', 'pg_cron is installed';
    ELSE
        RETURN QUERY SELECT 'Automation System', 'FAIL', 'pg_cron is NOT installed';
    END IF;

    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-trips-job' AND active = true) THEN
        RETURN QUERY SELECT 'Scheduled Job', 'PASS', 'process-trips-job is active and scheduled';
    ELSE
        RETURN QUERY SELECT 'Scheduled Job', 'FAIL', 'Background job is inactive or missing';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'process_trip_scheduled_actions') THEN
        RETURN QUERY SELECT 'Automation Function', 'PASS', 'process_trip_scheduled_actions exists';
    ELSE
        RETURN QUERY SELECT 'Automation Function', 'FAIL', 'Main automation function is missing';
    END IF;

    -- 2. Validation System
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'validate_trip_before_insert_or_update' AND tgenabled = 'O') THEN
        RETURN QUERY SELECT 'Validation Trigger', 'PASS', 'Conflict prevention trigger is ENABLED';
    ELSE
        RETURN QUERY SELECT 'Validation Trigger', 'FAIL', 'Trigger is missing or disabled';
    END IF;
    
    -- 3. Live Test (Simulating Conflict)
    -- البحث عن رحلة نشطة لاستخدام باصها وسائقها في التجربة
    -- نستخدم Alias t للرحلات لكي لا يحدث التباس
    SELECT t.bus_id, t.driver_id, t.departure_time 
    INTO v_conflicting_bus, v_conflicting_driver, v_test_depart
    FROM public.trips t
    WHERE t.status IN ('scheduled', 'in_progress') 
    AND t.bus_id IS NOT NULL 
    AND t.driver_id IS NOT NULL 
    LIMIT 1;

    IF v_conflicting_bus IS NOT NULL THEN
        -- Test Bus Logic Directly
        -- إذا كانت النتيجة FALSE (تعارض) فهذا يعني أن النظام يعمل ويمنع الباص المشغول
        v_bus_result := public.check_bus_availability(v_conflicting_bus, v_test_depart, v_test_depart + interval '1 hour');
        
        IF v_bus_result = FALSE THEN
            RETURN QUERY SELECT 'Bus Conflict Check', 'PASS', 'System correctly BLOCKED busy bus ' || v_conflicting_bus;
        ELSE
            -- إذا لم يكتشف التعارض (TRUE) فهناك مشكلة
            RETURN QUERY SELECT 'Bus Conflict Check', 'FAIL', 'System improperly allowed busy bus ' || v_conflicting_bus;
        END IF;

        -- Test Driver Logic Directly
        v_driver_result := public.check_driver_availability(v_conflicting_driver, v_test_depart, v_test_depart + interval '1 hour');
        
        IF v_driver_result = FALSE THEN
            RETURN QUERY SELECT 'Driver Conflict Check', 'PASS', 'System correctly BLOCKED busy driver ' || v_conflicting_driver;
        ELSE
            RETURN QUERY SELECT 'Driver Conflict Check', 'FAIL', 'System improperly allowed busy driver ' || v_conflicting_driver;
        END IF;

    ELSE
        RETURN QUERY SELECT 'Live Conflict Test', 'SKIP', 'Could not find any active trips to test against';
    END IF;

    RETURN;
END;
$$;

SELECT * FROM public.check_all_system();

ROLLBACK;
