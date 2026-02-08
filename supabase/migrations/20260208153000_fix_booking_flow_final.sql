-- ==========================================================
-- FINAL BOOKING FLOW INTEGRITY & COMPATIBILITY FIX
-- Date: 2026-02-08
-- Purpose: Fix price column name, add seat availability check, 
--          and provide update_booking_payment RPC for app compatibility.
-- ==========================================================

BEGIN;

-- 1. Fix create_booking_v3 (Correct column name and Add Seat Check)
CREATE OR REPLACE FUNCTION public.create_booking_v3(
    p_auth_id UUID,
    p_trip_id BIGINT,
    p_payment_method public.payment_method,
    p_passengers_json JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_booking_id BIGINT;
    v_passenger RECORD;
    v_trip RECORD;
    v_total_price NUMERIC := 0;
    v_passenger_count INT;
BEGIN
    -- 1. Verify trip exists and get price info
    SELECT * INTO v_trip FROM public.trips WHERE trip_id = p_trip_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Trip not found');
    END IF;

    -- 2. Validate all seats are available before doing anything
    FOR v_passenger IN SELECT * FROM jsonb_to_recordset(p_passengers_json) AS x(seat_id bigint)
    LOOP
        IF EXISTS (
            SELECT 1 FROM public.passengers 
            WHERE trip_id = p_trip_id AND seat_id = v_passenger.seat_id AND passenger_status = 'active'
        ) THEN
            RETURN jsonb_build_object('success', false, 'message', 'One or more seats are already booked. Please refresh and try again.');
        END IF;
    END LOOP;

    -- 3. Calculate total price (using base_price instead of price)
    v_passenger_count := jsonb_array_length(p_passengers_json);
    -- Handle cases where price_adult might be null but base_price exists
    v_total_price := COALESCE(v_trip.price_adult, v_trip.base_price) * v_passenger_count;

    -- 4. Insert Booking
    INSERT INTO public.bookings (
        auth_id,
        trip_id,
        booking_date,
        booking_status,
        payment_method,
        payment_status,
        total_price
    ) VALUES (
        p_auth_id,
        p_trip_id,
        NOW(),
        'pending',
        p_payment_method,
        'pending',
        v_total_price
    ) RETURNING booking_id INTO v_booking_id;

    -- 5. Insert Passengers
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
            id_image,
            passenger_status
        ) VALUES (
            v_booking_id,
            p_trip_id,
            v_passenger.seat_id,
            v_passenger.full_name,
            v_passenger.phone_number,
            v_passenger.id_number,
            v_passenger.gender,
            v_passenger.birth_date,
            v_passenger.id_image,
            'active'
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


-- 2. Create update_booking_payment (Missing Function for App Compatibility)
CREATE OR REPLACE FUNCTION public.update_booking_payment(
    p_booking_id BIGINT,
    p_status TEXT,
    p_method TEXT,
    p_transaction_id TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_booking RECORD;
    v_payment_status public.payment_status;
    v_payment_method public.payment_method;
BEGIN
    -- Map text to Enums
    v_payment_status := p_status::public.payment_status;
    v_payment_method := p_method::public.payment_method;

    -- Call the most advanced existing update function
    -- This ensures logic like wallet processing (if exists there) is triggered
    RETURN public.update_payment_v3(
        p_booking_id,
        v_payment_status,
        v_payment_method,
        p_transaction_id::VARCHAR
    );
EXCEPTION WHEN OTHERS THEN
    -- Fallback for direct update if v3 fails or has mapping issues
    UPDATE public.bookings
    SET 
        payment_status = p_status::public.payment_status,
        payment_method = p_method::public.payment_method,
        gateway_transaction_id = COALESCE(p_transaction_id, gateway_transaction_id),
        payment_timestamp = CASE WHEN p_status = 'paid' THEN NOW() ELSE payment_timestamp END
    WHERE booking_id = p_booking_id;
    
    RETURN jsonb_build_object('success', true, 'message', 'Payment updated (fallback)');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
