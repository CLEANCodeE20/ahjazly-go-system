-- Hardening Seat Availability Logic
-- This ensures that seats are released even if only the booking status is changed

-- 1. Update get_available_seats to join with bookings
CREATE OR REPLACE FUNCTION public.get_available_seats(p_trip_id BIGINT)
RETURNS JSONB AS $$
DECLARE
    v_bus_id BIGINT;
    v_seats JSONB;
BEGIN
    -- 1. Get bus_id for the trip
    SELECT bus_id INTO v_bus_id FROM public.trips WHERE trip_id = p_trip_id;
    
    -- 2. Fetch all seats for this bus, marking them as taken ONLY if an ACTIVE passenger in a VALID booking exists
    SELECT jsonb_agg(
        jsonb_build_object(
            'seat_id', s.seat_id,
            'seat_number', s.seat_number,
            'is_available', NOT EXISTS (
                SELECT 1 FROM public.passengers p 
                JOIN public.bookings b ON p.booking_id = b.booking_id
                WHERE b.trip_id = p_trip_id 
                  AND p.seat_id = s.seat_id 
                  AND p.passenger_status = 'active'
                  AND b.booking_status NOT IN ('cancelled', 'expired', 'rejected')
            )
        )
    ) INTO v_seats
    FROM public.seats s
    WHERE s.bus_id = v_bus_id;

    RETURN jsonb_build_object(
        'success', true,
        'seats', COALESCE(v_seats, '[]'::jsonb)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. (Optinal) Maintenance Trigger: Keep passengers in sync with booking status
-- If a booking status is updated manually via UI, this trigger ensures passengers are also updated
CREATE OR REPLACE FUNCTION public.sync_passenger_status_on_booking_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.booking_status = 'cancelled' AND OLD.booking_status != 'cancelled') THEN
        UPDATE public.passengers SET passenger_status = 'cancelled' WHERE booking_id = NEW.booking_id;
    ELSIF (NEW.booking_status = 'confirmed' AND OLD.booking_status = 'pending') THEN
        UPDATE public.passengers SET passenger_status = 'active' WHERE booking_id = NEW.booking_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_passenger_status ON public.bookings;
CREATE TRIGGER trigger_sync_passenger_status
AFTER UPDATE OF booking_status ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.sync_passenger_status_on_booking_change();
