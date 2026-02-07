-- ==========================================================
-- USER FLOW INTEGRITY FIXES (UUID & Disruption Alignment)
-- Date: 2026-02-07
-- ==========================================================

BEGIN;
-- Force drop legacy user_type if it survived previous purges
ALTER TABLE public.users DROP COLUMN IF EXISTS user_type CASCADE;

-- 1. Update process_wallet_transaction to use auth_id (UUID)
DROP FUNCTION IF EXISTS public.process_wallet_transaction(UUID, wallet_transaction_type, NUMERIC, VARCHAR, TEXT) CASCADE;
CREATE OR REPLACE FUNCTION public.process_wallet_transaction(
    p_auth_id UUID, -- CHANGED from BIGINT
    p_type wallet_transaction_type,
    p_amount NUMERIC,
    p_reference_id VARCHAR DEFAULT NULL,
    p_description TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_wallet_id BIGINT;
    v_old_balance NUMERIC;
    v_new_balance NUMERIC;
    v_current_user_id UUID;
BEGIN
    -- Get current user for audit (UUID based)
    v_current_user_id := auth.uid();

    -- Get wallet and lock for update (Using auth_id)
    SELECT wallet_id, balance INTO v_wallet_id, v_old_balance 
    FROM public.wallets 
    WHERE auth_id = p_auth_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Wallet not found for user');
    END IF;

    -- Calculate new balance
    IF p_type IN ('payment', 'withdrawal') THEN
        v_new_balance := v_old_balance - p_amount;
        IF v_new_balance < 0 THEN
            RETURN jsonb_build_object('success', false, 'message', 'Insufficient balance');
        END IF;
    ELSE
        v_new_balance := v_old_balance + p_amount;
    END IF;

    -- Update wallet
    UPDATE public.wallets 
    SET balance = v_new_balance, updated_at = now() 
    WHERE wallet_id = v_wallet_id;

    -- Log transaction (Note: created_by should also be UUID if table updated, 
    -- but for now we use auth_id context if possible. Checking wallet_transactions schema...)
    INSERT INTO public.wallet_transactions (
        wallet_id, type, amount, previous_balance, new_balance, reference_id, description
    ) VALUES (
        v_wallet_id, p_type, p_amount, v_old_balance, v_new_balance, p_reference_id, p_description
    );

    RETURN jsonb_build_object(
        'success', true, 
        'new_balance', v_new_balance
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Robust Trip Search with Disruption Awareness
DROP FUNCTION IF EXISTS public.search_trips(TEXT, TEXT, DATE, TEXT) CASCADE;
CREATE OR REPLACE FUNCTION public.search_trips(
    _from_stop TEXT,
    _to_city TEXT,
    _date DATE,
    _bus_class TEXT
)
RETURNS TABLE (
    trip_id BIGINT,
    departure_time TIMESTAMP,
    arrival_time TIMESTAMP,
    price_adult NUMERIC,
    price_child NUMERIC,
    origin_city VARCHAR,
    destination_city VARCHAR,
    route_from_stop VARCHAR,
    route_to_stop VARCHAR,
    model VARCHAR,
    bus_class VARCHAR,
    company_name VARCHAR,
    available_seats BIGINT,
    trip_bus_id BIGINT,
    seat_layout JSONB,
    linked_trip_id BIGINT,
    trip_status VARCHAR
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.trip_id,
        t.departure_time,
        t.arrival_time,
        t.base_price AS price_adult,
        (t.base_price) AS price_child,
        r.origin_city,
        r.destination_city,
        rs_from.stop_name AS route_from_stop,
        rs_to.stop_name AS route_to_stop,
        bu.model,
        bc.class_name AS bus_class,
        p.company_name,
        (
            (
                CASE 
                    WHEN EXISTS (SELECT 1 FROM public.seats s WHERE s.bus_id = t.bus_id) THEN
                        (SELECT COUNT(*) FROM public.seats s WHERE s.bus_id = t.bus_id AND s.is_available = true)
                    ELSE 
                        COALESCE(bu.capacity, 0)
                END
            ) - 
            -- EXCLUDE ALL NON-CANCELLED PASSENGERS
            (SELECT COUNT(*) FROM public.passengers pass WHERE pass.trip_id = t.trip_id AND pass.passenger_status != 'cancelled') -
            (SELECT jsonb_array_length(COALESCE(t.blocked_seats, '[]'::jsonb)))
        ) AS available_seats,
        t.bus_id AS trip_bus_id,
        COALESCE(bu.seat_layout, '{}'::jsonb) AS seat_layout,
        t.linked_trip_id,
        t.status::VARCHAR AS trip_status
    FROM
        public.trips t
    JOIN
        public.routes r ON t.route_id = r.route_id
    JOIN
        public.route_stops rs_from ON rs_from.route_id = r.route_id
    JOIN
        public.route_stops rs_to ON rs_to.route_id = r.route_id
    JOIN
        public.buses bu ON t.bus_id = bu.bus_id
    JOIN
        public.bus_classes bc ON bu.bus_class_id = bc.bus_class_id
    JOIN
        public.partners p ON t.partner_id = p.partner_id
    WHERE
        DATE(t.departure_time) = _date
        AND (TRIM(rs_from.stop_name) ILIKE TRIM(_from_stop) OR rs_from.stop_name ILIKE '%' || TRIM(_from_stop) || '%')
        AND (TRIM(rs_to.stop_name) ILIKE TRIM(_to_city) OR rs_to.stop_name ILIKE '%' || TRIM(_to_city) || '%')
        AND rs_from.stop_order < rs_to.stop_order
        AND (bc.class_name ILIKE _bus_class OR _bus_class IS NULL OR _bus_class = '')
        
        -- DISRUPTION AWARENESS: Only show sellable trips
        AND t.status IN ('scheduled', 'delayed') -- Exclude in_progress, diverted, emergency from NEW bookings
        
        AND t.departure_time > NOW() + INTERVAL '5 minutes'
        AND (
            (
                CASE 
                    WHEN EXISTS (SELECT 1 FROM public.seats s WHERE s.bus_id = t.bus_id) THEN
                        (SELECT COUNT(*) FROM public.seats s WHERE s.bus_id = t.bus_id AND s.is_available = true)
                    ELSE 
                        COALESCE(bu.capacity, 0)
                END
            ) - 
            (SELECT COUNT(*) FROM public.passengers pass WHERE pass.trip_id = t.trip_id AND pass.passenger_status != 'cancelled') -
            (SELECT jsonb_array_length(COALESCE(t.blocked_seats, '[]'::jsonb)))
        ) > 0
    ORDER BY t.departure_time ASC;
END;
$$;


-- 3. Update update_payment_v3 to be UUID aware
DROP FUNCTION IF EXISTS public.update_payment_v3(BIGINT, public.payment_status, public.payment_method, VARCHAR) CASCADE;
CREATE OR REPLACE FUNCTION public.update_payment_v3(
    p_booking_id BIGINT,
    p_payment_status public.payment_status,
    p_payment_method public.payment_method,
    p_transaction_id VARCHAR DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_booking RECORD;
    v_wallet_result JSONB;
BEGIN
    SELECT * INTO v_booking FROM public.bookings WHERE booking_id = p_booking_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Booking not found');
    END IF;

    IF v_booking.payment_status = 'paid' AND p_payment_status = 'paid' THEN
        RETURN jsonb_build_object('success', true, 'message', 'Payment already confirmed');
    END IF;

    -- Handle Wallet Payment (Using auth_id)
    IF p_payment_method = 'wallet' AND p_payment_status = 'paid' THEN
        SELECT public.process_wallet_transaction(
            v_booking.auth_id, -- CHANGED from user_id (Uses UUID)
            'payment',
            v_booking.total_price,
            p_booking_id::text,
            format('دفع قيمة الحجز رقم #%s', p_booking_id)
        ) INTO v_wallet_result;

        IF NOT (v_wallet_result->>'success')::boolean THEN
            RETURN v_wallet_result;
        END IF;
    END IF;

    UPDATE public.bookings
    SET 
        payment_status = p_payment_status,
        payment_method = p_payment_method,
        gateway_transaction_id = COALESCE(p_transaction_id, gateway_transaction_id),
        payment_timestamp = CASE WHEN p_payment_status = 'paid' THEN NOW() ELSE payment_timestamp END
    WHERE booking_id = p_booking_id;

    RETURN jsonb_build_object('success', true, 'message', 'Payment updated successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. Unified Identity Synchronization (Auth Trigger)
-- ==========================================================

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
    v_is_super BOOLEAN;
    v_role public.app_role;
    v_gender public.gender_type;
BEGIN
    -- Determine role based on email domain
    v_is_super := (new.email LIKE '%@admin.com') OR (new.email LIKE '%@ahjazly.com');
    
    IF v_is_super THEN
        v_role := 'SUPERUSER'::public.app_role;
    ELSE
        v_role := 'TRAVELER'::public.app_role;
    END IF;

    -- Map Gender from metadata (M/F -> male/female)
    CASE (new.raw_user_meta_data->>'gender')
        WHEN 'M' THEN v_gender := 'male'::public.gender_type;
        WHEN 'F' THEN v_gender := 'female'::public.gender_type;
        ELSE v_gender := NULL;
    END CASE;

    -- Insert into public.users with full metadata (WITHOUT user_type)
    INSERT INTO public.users (
        auth_id, 
        full_name, 
        email, 
        phone_number,
        gender,
        account_status
    )
    VALUES (
        new.id, 
        COALESCE(new.raw_user_meta_data->>'full_name', 'New User'), 
        new.email, 
        new.raw_user_meta_data->>'phone_number',
        v_gender,
        'active'
    )
    ON CONFLICT (auth_id) DO UPDATE
    SET 
        email = new.email,
        full_name = EXCLUDED.full_name,
        phone_number = EXCLUDED.phone_number,
        gender = EXCLUDED.gender;

    -- Assign Role in user_roles
    INSERT INTO public.user_roles (user_id, role, partner_id)
    VALUES (new.id, v_role, NULL)
    ON CONFLICT (user_id, role) DO NOTHING;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Driver Operations Optimization
-- ==========================================================

-- Standardize get_driver_trips (Fixing passenger count)
DROP FUNCTION IF EXISTS public.get_driver_trips(DATE, DATE, TEXT) CASCADE;
CREATE OR REPLACE FUNCTION public.get_driver_trips(
    p_start_date DATE DEFAULT CURRENT_DATE,
    p_end_date DATE DEFAULT CURRENT_DATE,
    p_status TEXT DEFAULT NULL
)
RETURNS TABLE (
    trip_id BIGINT,
    route_id BIGINT,
    bus_id BIGINT,
    departure_time TIMESTAMP,
    arrival_time TIMESTAMP,
    status VARCHAR(50),
    base_price NUMERIC(10,2),
    origin_city VARCHAR(100),
    destination_city VARCHAR(100),
    bus_license_plate VARCHAR(50),
    passenger_count BIGINT
) AS $$
DECLARE
    v_driver_id BIGINT;
BEGIN
    SELECT d.driver_id INTO v_driver_id FROM public.drivers d WHERE d.auth_id = auth.uid() LIMIT 1;
    IF v_driver_id IS NULL THEN RAISE EXCEPTION 'Driver account not found'; END IF;

    RETURN QUERY
    SELECT 
        t.trip_id, t.route_id, t.bus_id, t.departure_time, t.arrival_time,
        t.status::VARCHAR(50), t.base_price, r.origin_city, r.destination_city,
        b.license_plate, 
        (SELECT COUNT(*) FROM public.passengers p WHERE p.trip_id = t.trip_id AND p.passenger_status != 'cancelled') -- Correct count
    FROM public.trips t
    LEFT JOIN public.routes r ON t.route_id = r.route_id
    LEFT JOIN public.buses b ON t.bus_id = b.bus_id
    WHERE t.driver_id = v_driver_id
        AND DATE(t.departure_time) BETWEEN p_start_date AND p_end_date
        AND (p_status IS NULL OR t.status::TEXT = p_status)
    ORDER BY t.departure_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Standardize log_passenger_boarding (Adding trip validation)
DROP FUNCTION IF EXISTS public.log_passenger_boarding(BIGINT, BIGINT, VARCHAR, NUMERIC, NUMERIC, TEXT) CASCADE;
CREATE OR REPLACE FUNCTION public.log_passenger_boarding(
    p_passenger_id BIGINT,
    p_trip_id BIGINT,
    p_boarding_method VARCHAR(20) DEFAULT 'manual',
    p_location_lat NUMERIC(10,8) DEFAULT NULL,
    p_location_lng NUMERIC(11,8) DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_driver_id BIGINT;
BEGIN
    -- Security: Get driver ID for current session
    SELECT driver_id INTO v_driver_id FROM public.drivers WHERE auth_id = auth.uid() LIMIT 1;
    IF v_driver_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Driver not found'); END IF;

    -- Authorization & Integrity: Check if trip belongs to driver and passenger belongs to trip
    IF NOT EXISTS (SELECT 1 FROM public.trips WHERE trip_id = p_trip_id AND driver_id = v_driver_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized or mismatch: Trip does not belong to you');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.passengers WHERE passenger_id = p_passenger_id AND trip_id = p_trip_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Integrity error: Passenger does not belong to this trip');
    END IF;

    -- Log Boarding
    INSERT INTO public.passenger_boarding_log (
        passenger_id, trip_id, driver_id, boarding_method, location_lat, location_lng, notes
    ) VALUES (
        p_passenger_id, p_trip_id, v_driver_id, p_boarding_method, p_location_lat, p_location_lng, p_notes
    );

    -- Update Status
    UPDATE public.passengers SET passenger_status = 'boarded' WHERE passenger_id = p_passenger_id;

    RETURN jsonb_build_object('success', true, 'passenger_id', p_passenger_id, 'boarding_time', NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- New Intelligence RPC: get_driver_stats_v2 (Performance optimization for dashboard)
DROP FUNCTION IF EXISTS public.get_driver_stats_v2() CASCADE;
CREATE OR REPLACE FUNCTION public.get_driver_stats_v2()
RETURNS JSONB AS $$
DECLARE
    v_driver RECORD;
    v_total_trips BIGINT;
    v_completed_trips BIGINT;
    v_total_passengers BIGINT;
    v_earnings NUMERIC;
BEGIN
    -- 1. Get driver info
    SELECT * INTO v_driver FROM public.drivers WHERE auth_id = auth.uid() LIMIT 1;
    IF v_driver.driver_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Driver not found'); END IF;

    -- 2. Trips stats
    SELECT COUNT(*) INTO v_total_trips FROM public.trips WHERE driver_id = v_driver.driver_id;
    SELECT COUNT(*) INTO v_completed_trips FROM public.trips WHERE driver_id = v_driver.driver_id AND status = 'completed';

    -- 3. Passenger stats (Excluding cancelled)
    SELECT COUNT(p.passenger_id) INTO v_total_passengers
    FROM public.passengers p
    JOIN public.trips t ON p.trip_id = t.trip_id
    WHERE t.driver_id = v_driver.driver_id AND p.passenger_status != 'cancelled';

    -- 4. Earnings (From partner balance as per existing business logic)
    SELECT COALESCE(current_balance, 0) INTO v_earnings
    FROM public.partner_balance_report
    WHERE partner_id = v_driver.partner_id
    LIMIT 1;

    RETURN jsonb_build_object(
        'success', true,
        'stats', jsonb_build_object(
            'total_trips', v_total_trips,
            'completed_trips', v_completed_trips,
            'total_passengers', v_total_passengers,
            'total_earnings', COALESCE(v_earnings, 0)
        ),
        'driver_id', v_driver.driver_id,
        'partner_id', v_driver.partner_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
