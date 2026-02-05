-- ========================================================
-- TRIP AUTOMATION VERIFICATION & REPAIR
-- Date: 2026-02-05
-- Purpose: Verify and fix automated trip lifecycle system
-- ========================================================

BEGIN;

-- 1. Verify pg_cron extension is enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
    ) THEN
        RAISE NOTICE 'Installing pg_cron extension...';
        CREATE EXTENSION IF NOT EXISTS pg_cron;
    ELSE
        RAISE NOTICE 'pg_cron extension is already installed ✓';
    END IF;
END $$;

-- 2. Verify the automation function exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'process_trip_scheduled_actions'
    ) THEN
        RAISE EXCEPTION 'ERROR: process_trip_scheduled_actions function not found!';
    ELSE
        RAISE NOTICE 'Automation function exists ✓';
    END IF;
END $$;

-- 3. Verify or create the scheduled job
DO $$
DECLARE
    v_job_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_job_count
    FROM cron.job
    WHERE jobname = 'process-trips-job';
    
    IF v_job_count = 0 THEN
        RAISE NOTICE 'Creating scheduled job...';
        PERFORM cron.schedule(
            'process-trips-job',
            '* * * * *',
            'SELECT public.process_trip_scheduled_actions()'
        );
        RAISE NOTICE 'Scheduled job created ✓';
    ELSE
        RAISE NOTICE 'Scheduled job already exists ✓';
    END IF;
END $$;

-- 4. Check for trips that should have started but are still scheduled
DO $$
DECLARE
    v_delayed_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_delayed_count
    FROM public.trips
    WHERE status = 'scheduled'
      AND departure_time <= NOW();
    
    IF v_delayed_count > 0 THEN
        RAISE NOTICE 'WARNING: Found % trips that should be in_progress', v_delayed_count;
        RAISE NOTICE 'Running manual fix...';
        
        -- Fix them now
        UPDATE public.trips
        SET status = 'in_progress',
            updated_at = NOW()
        WHERE status = 'scheduled'
          AND departure_time <= NOW();
        
        RAISE NOTICE 'Fixed % delayed trips ✓', v_delayed_count;
    ELSE
        RAISE NOTICE 'No delayed trips found ✓';
    END IF;
END $$;

-- 5. Display current system status
DO $$
DECLARE
    v_job_active BOOLEAN;
    v_last_run TIMESTAMP;
    v_last_status TEXT;
BEGIN
    -- Get job status
    SELECT active INTO v_job_active
    FROM cron.job
    WHERE jobname = 'process-trips-job';
    
    -- Get last execution
    SELECT start_time, status INTO v_last_run, v_last_status
    FROM cron.job_run_details
    WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process-trips-job')
    ORDER BY start_time DESC
    LIMIT 1;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SYSTEM STATUS REPORT';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Job Active: %', COALESCE(v_job_active::TEXT, 'UNKNOWN');
    RAISE NOTICE 'Last Run: %', COALESCE(v_last_run::TEXT, 'NEVER');
    RAISE NOTICE 'Last Status: %', COALESCE(v_last_status, 'N/A');
    RAISE NOTICE '========================================';
END $$;

COMMIT;

-- 6. Show upcoming trips (next 2 hours)
SELECT 
    trip_id,
    status,
    departure_time,
    EXTRACT(EPOCH FROM (departure_time - NOW()))/60 AS minutes_until_departure
FROM public.trips
WHERE status = 'scheduled'
  AND departure_time BETWEEN NOW() AND (NOW() + INTERVAL '2 hours')
ORDER BY departure_time ASC
LIMIT 10;
