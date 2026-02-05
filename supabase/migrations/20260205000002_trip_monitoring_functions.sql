-- ========================================================
-- TRIP MONITORING RPC FUNCTIONS
-- Date: 2026-02-05
-- Purpose: Provide monitoring functions for trip automation system
-- ========================================================

BEGIN;

-- ============================================================
-- 1. Get Automation System Status
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_automation_status()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSON;
    v_pg_cron_enabled BOOLEAN;
    v_job_exists BOOLEAN;
    v_job_active BOOLEAN;
    v_last_run TIMESTAMP;
    v_last_status TEXT;
    v_function_exists BOOLEAN;
BEGIN
    -- Check pg_cron extension
    SELECT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
    ) INTO v_pg_cron_enabled;

    -- Check function exists
    SELECT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'process_trip_scheduled_actions'
    ) INTO v_function_exists;

    -- Check job exists and is active
    SELECT 
        EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-trips-job'),
        COALESCE((SELECT active FROM cron.job WHERE jobname = 'process-trips-job'), false)
    INTO v_job_exists, v_job_active;

    -- Get last execution info
    SELECT start_time, status INTO v_last_run, v_last_status
    FROM cron.job_run_details
    WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process-trips-job')
    ORDER BY start_time DESC
    LIMIT 1;

    -- Build result
    v_result := json_build_object(
        'pg_cron_enabled', v_pg_cron_enabled,
        'function_exists', v_function_exists,
        'job_exists', v_job_exists,
        'job_active', v_job_active,
        'last_run', v_last_run,
        'last_status', v_last_status,
        'system_healthy', (v_pg_cron_enabled AND v_function_exists AND v_job_exists AND v_job_active)
    );

    RETURN v_result;
END;
$$;

-- ============================================================
-- 2. Get Delayed Trips (should be in_progress but still scheduled)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_delayed_trips()
RETURNS TABLE (
    trip_id BIGINT,
    status trip_status,
    departure_time TIMESTAMP,
    minutes_since_departure NUMERIC,
    route_id BIGINT,
    partner_id BIGINT,
    origin_city VARCHAR,
    destination_city VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.trip_id,
        t.status,
        t.departure_time,
        ROUND(EXTRACT(EPOCH FROM (NOW() - t.departure_time))/60, 2) AS minutes_since_departure,
        t.route_id,
        t.partner_id,
        r.origin_city,
        r.destination_city
    FROM public.trips t
    JOIN public.routes r ON t.route_id = r.route_id
    WHERE t.status = 'scheduled'
      AND t.departure_time <= NOW()
    ORDER BY t.departure_time DESC
    LIMIT 50;
END;
$$;

-- ============================================================
-- 3. Get Upcoming Trips
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_upcoming_trips(p_hours INTEGER DEFAULT 2)
RETURNS TABLE (
    trip_id BIGINT,
    status trip_status,
    departure_time TIMESTAMP,
    minutes_until_departure NUMERIC,
    route_id BIGINT,
    partner_id BIGINT,
    origin_city VARCHAR,
    destination_city VARCHAR,
    confirmed_bookings INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.trip_id,
        t.status,
        t.departure_time,
        ROUND(EXTRACT(EPOCH FROM (t.departure_time - NOW()))/60, 2) AS minutes_until_departure,
        t.route_id,
        t.partner_id,
        r.origin_city,
        r.destination_city,
        COUNT(b.booking_id)::INTEGER AS confirmed_bookings
    FROM public.trips t
    JOIN public.routes r ON t.route_id = r.route_id
    LEFT JOIN public.bookings b ON t.trip_id = b.trip_id AND b.booking_status = 'confirmed'
    WHERE t.status = 'scheduled'
      AND t.departure_time BETWEEN NOW() AND (NOW() + (p_hours || ' hours')::INTERVAL)
    GROUP BY t.trip_id, t.status, t.departure_time, t.route_id, t.partner_id, r.origin_city, r.destination_city
    ORDER BY t.departure_time ASC
    LIMIT 50;
END;
$$;

-- ============================================================
-- 4. Get Automation Execution Log
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_automation_execution_log(p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
    run_id BIGINT,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    status TEXT,
    return_message TEXT,
    duration_seconds NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        jrd.runid,
        jrd.start_time,
        jrd.end_time,
        jrd.status,
        jrd.return_message,
        ROUND(EXTRACT(EPOCH FROM (jrd.end_time - jrd.start_time)), 2) AS duration_seconds
    FROM cron.job_run_details jrd
    WHERE jrd.jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process-trips-job')
    ORDER BY jrd.start_time DESC
    LIMIT p_limit;
END;
$$;

-- ============================================================
-- 5. Manual Trigger for Trip Automation
-- ============================================================
CREATE OR REPLACE FUNCTION public.manual_trigger_trip_automation()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSON;
    v_error TEXT;
BEGIN
    -- Execute the automation function
    BEGIN
        PERFORM public.process_trip_scheduled_actions();
        
        v_result := json_build_object(
            'success', true,
            'message', 'تم تشغيل الأتمتة يدوياً بنجاح',
            'timestamp', NOW()
        );
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS v_error = MESSAGE_TEXT;
        v_result := json_build_object(
            'success', false,
            'message', 'فشل التشغيل اليدوي',
            'error', v_error,
            'timestamp', NOW()
        );
    END;
    
    RETURN v_result;
END;
$$;

-- ============================================================
-- 6. Get Trip Notification Statistics
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_trip_notification_stats(p_hours INTEGER DEFAULT 24)
RETURNS TABLE (
    notification_type TEXT,
    count BIGINT,
    last_sent TIMESTAMP
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.title AS notification_type,
        COUNT(*) AS count,
        MAX(n.created_at) AS last_sent
    FROM public.notifications n
    WHERE n.type = 'trip'
      AND n.created_at >= NOW() - (p_hours || ' hours')::INTERVAL
      AND n.title IN (
          'تذكير: رحلتك خلال ساعة',
          'تذكير: رحلتك خلال 30 دقيقة',
          'عاجل: رحلتك خلال 15 دقيقة',
          'بدأت الرحلة 🚌',
          'شكراً لاختيارك خدماتنا'
      )
    GROUP BY n.title
    ORDER BY last_sent DESC;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_automation_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_delayed_trips() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_upcoming_trips(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_automation_execution_log(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.manual_trigger_trip_automation() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_trip_notification_stats(INTEGER) TO authenticated;

COMMIT;

-- Display success message
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MONITORING FUNCTIONS INSTALLED ✓';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Available Functions:';
    RAISE NOTICE '  - get_automation_status()';
    RAISE NOTICE '  - get_delayed_trips()';
    RAISE NOTICE '  - get_upcoming_trips(hours)';
    RAISE NOTICE '  - get_automation_execution_log(limit)';
    RAISE NOTICE '  - manual_trigger_trip_automation()';
    RAISE NOTICE '  - get_trip_notification_stats(hours)';
    RAISE NOTICE '========================================';
END $$;
