-- =============================================
-- DIAGNOSTIC RATING ELIGIBILITY FUNCTION
-- This version will RAISE EXCEPTION with specific reasons
-- to help us identify exactly why it's failing.
-- =============================================

CREATE OR REPLACE FUNCTION public.can_user_rate_trip(
    p_user_id BIGINT,
    p_trip_id BIGINT,
    p_booking_id BIGINT
) RETURNS BOOLEAN AS $$
DECLARE
    v_booking_exists BOOLEAN;
    v_booking_status public.booking_status;
    v_trip_status public.trip_status;
    v_arrival_time TIMESTAMP;
    v_departure_time TIMESTAMP;
    v_already_rated BOOLEAN;
    v_booking_user_id BIGINT;
BEGIN
    -- 1. Check if booking exists and get details
    SELECT user_id, booking_status INTO v_booking_user_id, v_booking_status
    FROM public.bookings 
    WHERE booking_id = p_booking_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Diagnostic: Booking ID % not found', p_booking_id;
    END IF;

    IF v_booking_user_id != p_user_id THEN
        RAISE EXCEPTION 'Diagnostic: Booking belongs to user %, but you are user %', v_booking_user_id, p_user_id;
    END IF;

    -- 2. Check Trip
    SELECT status, arrival_time, departure_time INTO v_trip_status, v_arrival_time, v_departure_time
    FROM public.trips
    WHERE trip_id = p_trip_id;

    IF v_trip_status IS NULL THEN
        RAISE EXCEPTION 'Diagnostic: Trip ID % not found', p_trip_id;
    END IF;

    -- 3. Check Statuses
    IF v_booking_status IN ('cancelled', 'pending') THEN
        RAISE EXCEPTION 'Diagnostic: Booking status is %, must be confirmed/paid/completed', v_booking_status;
    END IF;

    IF v_trip_status = 'cancelled' THEN
        RAISE EXCEPTION 'Diagnostic: Trip is cancelled';
    END IF;

    -- 4. Check Time (The most likely culprit)
    -- FINAL STRATEGY: Allow if status is 'completed' OR time has passed with 6h margin
    IF NOT (v_trip_status = 'completed' OR COALESCE(v_arrival_time, v_departure_time + INTERVAL '4 hours') <= (NOW() + INTERVAL '6 hours')) THEN
        RAISE EXCEPTION 'Diagnostic: Trip not finished yet. Status: %, Arrival: %, Now: %', v_trip_status, COALESCE(v_arrival_time, v_departure_time + INTERVAL '4 hours'), NOW();
    END IF;

    -- 5. Check if already rated
    SELECT EXISTS (SELECT 1 FROM public.ratings WHERE booking_id = p_booking_id) INTO v_already_rated;
    IF v_already_rated THEN
        RAISE EXCEPTION 'Diagnostic: You have already rated this booking';
    END IF;

    -- If we reached here, it should be TRUE
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
