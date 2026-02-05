-- ========================================================
-- AUTOMATED TRIP LIFECYCLE & NOTIFICATIONS ENGINE
-- ========================================================

-- 1. Enable pg_cron extension (requires superuser, usually enabled in Supabase by default in 'extensions' schema)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Background Processor Function
-- This function handles all time-based automation for trips.
CREATE OR REPLACE FUNCTION public.process_trip_scheduled_actions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count_started INTEGER := 0;
    v_count_notified INTEGER := 0;
BEGIN
    -- TASK A: Automatic Status Update (Scheduled -> In Progress)
    -- Logic: Any 'scheduled' trip whose departure_time is now or in the past (up to 5 mins ago)
    -- should be marked as 'in_progress'.
    WITH updated_trips AS (
        UPDATE public.trips
        SET status = 'in_progress',
            updated_at = NOW()
        WHERE status = 'scheduled'
          AND departure_time <= (NOW() + INTERVAL '2 minutes') -- Slight buffer for system latency
        RETURNING trip_id
    )
    SELECT count(*) INTO v_count_started FROM updated_trips;

    -- TASK B: 1-Hour Pre-Trip Notifications
    -- Logic: Find confirmed bookings for trips starting in 55-65 minutes.
    -- Ensure we don't send duplicates for the same booking.
    WITH passengers_to_notify AS (
        SELECT DISTINCT 
            b.auth_id, 
            t.trip_id, 
            b.booking_id,
            t.departure_time,
            r.origin_city,
            r.destination_city
        FROM public.bookings b
        JOIN public.trips t ON b.trip_id = t.trip_id
        JOIN public.routes r ON t.route_id = r.route_id
        WHERE b.booking_status = 'confirmed'
          AND t.departure_time BETWEEN (NOW() + INTERVAL '55 minutes') AND (NOW() + INTERVAL '65 minutes')
          -- Idempotency check: Don't notify if a 'trip_reminder' message already exists for this booking
          AND NOT EXISTS (
              SELECT 1 FROM public.notifications n
              WHERE n.related_booking_id = b.booking_id
                AND n.title = 'تذكير بموعد الرحلة'
          )
    ),
    inserted_notifications AS (
        INSERT INTO public.notifications (auth_id, title, message, related_booking_id, type, priority)
        SELECT 
            auth_id,
            'تذكير بموعد الرحلة',
            format('تذكير: موعد انطلاق رحلتك رقم #%s من %s إلى %s هو خلال ساعة واحدة (%s). يرجى التواجد في المحطة قبل الموعد.', 
                   trip_id, origin_city, destination_city, to_char(departure_time, 'HH24:MI')),
            booking_id,
            'trip'::notification_type,
            'high'
        FROM passengers_to_notify
        RETURNING notification_id
    )
    SELECT count(*) INTO v_count_notified FROM inserted_notifications;

    -- LOGGING (Optional: can be viewed in Postgres logs)
    -- RAISE NOTICE 'Lifecycle Run: % trips started, % passengers notified.', v_count_started, v_count_notified;
END;
$$;

-- 3. Schedule the Cron Job
-- Frequency: Every 1 minute
-- This ensures high precision for status updates and ensures the 10-minute notification window is hit.

-- Unschedule first if exists to avoid duplicates during migration re-runs (Safe approach)
DO $$ 
BEGIN
    PERFORM cron.unschedule('process-trips-job');
EXCEPTION 
    WHEN OTHERS THEN 
        NULL; -- Ignore error if job doesn't exist
END $$;

-- Schedule
SELECT cron.schedule('process-trips-job', '* * * * *', 'SELECT public.process_trip_scheduled_actions()');

-- 4. Granting permissions (necessary for the background worker)
GRANT USAGE ON SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
