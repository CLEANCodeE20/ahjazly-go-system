-- Update create_booking_v2 to handle all fields including id_image, birth_date, and phone_number
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
BEGIN
    -- 1. Verify trip exists
    SELECT * INTO v_trip FROM public.trips WHERE trip_id = p_trip_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Trip not found');
    END IF;

    -- 2. Insert Booking
    INSERT INTO public.bookings (
        user_id,
        trip_id,
        booking_date,
        booking_status,
        payment_method,
        payment_status,
        total_price
    ) VALUES (
        p_user_id,
        p_trip_id,
        NOW(),
        'pending',
        p_payment_method,
        'pending',
        p_total_price
    ) RETURNING booking_id INTO v_booking_id;

    -- 3. Insert Passengers (Extracted with all fields)
    FOR v_passenger IN SELECT * FROM jsonb_to_recordset(p_passengers_json) 
        AS x(
            full_name text, 
            phone_number text, 
            id_number text, 
            seat_id bigint, 
            gender public.gender_type,
            birth_date date,
            id_image text
        )
    LOOP
        INSERT INTO public.passengers (
            booking_id,
            trip_id,
            seat_id,
            full_name,
            phone_number,
            id_number,
            gender,
            birth_date,
            id_image
        ) VALUES (
            v_booking_id,
            p_trip_id,
            v_passenger.seat_id,
            v_passenger.full_name,
            v_passenger.phone_number,
            v_passenger.id_number,
            v_passenger.gender,
            v_passenger.birth_date,
            v_passenger.id_image
        );
    END LOOP;

    RETURN jsonb_build_object(
        'success', true, 
        'booking_id', v_booking_id,
        'message', 'Booking created successfully'
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
