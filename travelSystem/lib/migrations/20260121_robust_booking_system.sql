-- =============================================
-- ROBUST BOOKING SYSTEM INTEGRATION
-- 1. Update create_booking_v2 to set expires_at
-- 2. Update get_available_seats to respect expiry
-- =============================================

-- 1. Update create_booking_v2 to set expires_at (15 minutes expiry)
CREATE OR REPLACE FUNCTION public.create_booking_v2(
    p_user_id BIGINT,
    p_trip_id BIGINT,
    p_total_price NUMERIC,
    p_payment_method public.payment_method,
    p_passengers_json JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_booking_id BIGINT;
    v_passenger RECORD;
    v_trip RECORD;
    v_expiry_time TIMESTAMP;
BEGIN
    -- Verify trip exists
    SELECT * INTO v_trip FROM public.trips WHERE trip_id = p_trip_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Trip not found');
    END IF;

    v_expiry_time := NOW() + INTERVAL '15 minutes';

    -- Insert Booking with 15 minutes expiry
    INSERT INTO public.bookings (
        user_id,
        trip_id,
        booking_date,
        booking_status,
        payment_method,
        payment_status,
        total_price,
        expires_at
    ) VALUES (
        p_user_id,
        p_trip_id,
        NOW(),
        'pending',
        p_payment_method,
        'pending',
        p_total_price,
        v_expiry_time
    ) RETURNING booking_id INTO v_booking_id;

    -- Insert Passengers
    FOR v_passenger IN SELECT * FROM jsonb_to_recordset(p_passengers_json) 
        AS x(full_name text, phone_number text, id_number text, seat_id bigint, gender public.gender_type, id_image text, birth_date date)
    LOOP
        INSERT INTO public.passengers (
            booking_id,
            trip_id,
            seat_id,
            full_name,
            phone_number,
            id_number,
            gender,
            id_image,
            birth_date
        ) VALUES (
            v_booking_id,
            p_trip_id,
            v_passenger.seat_id,
            v_passenger.full_name,
            v_passenger.phone_number,
            v_passenger.id_number,
            v_passenger.gender,
            v_passenger.id_image,
            v_passenger.birth_date
        );
    END LOOP;

    RETURN jsonb_build_object(
        'success', true, 
        'booking_id', v_booking_id,
        'message', 'Booking created successfully',
        'expires_at', v_expiry_time
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update get_available_seats to respect expiry
-- Only consider a seat "taken" if the booking is paid OR it's pending but NOT expired
CREATE OR REPLACE FUNCTION public.get_available_seats(p_trip_id BIGINT)
RETURNS JSONB AS $$
DECLARE
    v_bus_id BIGINT;
    v_seats JSONB;
BEGIN
    -- 1. Get bus_id for the trip
    SELECT bus_id INTO v_bus_id FROM public.trips WHERE trip_id = p_trip_id;
    
    -- 2. Fetch all seats for this bus
    SELECT jsonb_agg(
        jsonb_build_object(
            'seat_id', s.seat_id,
            'seat_number', s.seat_number,
            'is_available', NOT EXISTS (
                SELECT 1 FROM public.passengers p 
                JOIN public.bookings b ON p.booking_id = b.booking_id
                WHERE p.trip_id = p_trip_id 
                  AND p.seat_id = s.seat_id 
                  AND p.passenger_status = 'active'
                  AND (
                      b.payment_status = 'paid' 
                      OR (b.booking_status = 'pending' AND (b.expires_at IS NULL OR b.expires_at > NOW()))
                  )
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
