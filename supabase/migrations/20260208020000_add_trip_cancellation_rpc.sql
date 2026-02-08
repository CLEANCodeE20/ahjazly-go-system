-- Add pending_cancellation to trip_status if not exists
DO $$
BEGIN
    ALTER TYPE trip_status ADD VALUE IF NOT EXISTS 'pending_cancellation';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create request_trip_cancellation function
CREATE OR REPLACE FUNCTION request_trip_cancellation(p_trip_id BIGINT, p_reason TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_trip_exists BOOLEAN;
    v_passenger_count INT;
    v_trip_status trip_status;
BEGIN
    -- Check if trip exists
    SELECT EXISTS(SELECT 1 FROM trips WHERE trip_id = p_trip_id), status
    INTO v_trip_exists, v_trip_status
    FROM trips
    WHERE trip_id = p_trip_id;

    IF NOT v_trip_exists THEN
        RAISE EXCEPTION 'Trip not found';
    END IF;

    -- Count active bookings (confirmed or paid)
    SELECT COUNT(*)
    INTO v_passenger_count
    FROM bookings
    WHERE trip_id = p_trip_id
    AND booking_status IN ('confirmed', 'paid');

    -- Logic
    IF v_passenger_count > 0 THEN
        -- If passengers exist, mark as pending cancellation
        UPDATE trips
        SET status = 'pending_cancellation',
            cancellation_reason = p_reason
        WHERE trip_id = p_trip_id;

        RETURN jsonb_build_object(
            'action', 'pending_approval',
            'passengers', v_passenger_count
        );
    ELSE
        -- If no passengers, cancel immediately
        UPDATE trips
        SET status = 'cancelled',
            cancellation_reason = p_reason
        WHERE trip_id = p_trip_id;

        RETURN jsonb_build_object(
            'action', 'cancelled',
            'passengers', 0
        );
    END IF;
END;
$$;
