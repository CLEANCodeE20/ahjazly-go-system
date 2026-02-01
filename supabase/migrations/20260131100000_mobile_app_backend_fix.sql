-- ==========================================================
-- MOBILE APP BACKEND FIX (Gold Standard Alignment)
-- Date: 2026-01-31
-- Purpose: add auth_id to bookings, compatible RPCs, and correct Views
-- ==========================================================

BEGIN;

-- 1. Ensure 'auth_id' exists in 'bookings' table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'auth_id') THEN
        ALTER TABLE public.bookings ADD COLUMN auth_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 2. Backfill auth_id from users table (Best Effort)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'user_id') THEN
        UPDATE public.bookings b
        SET auth_id = u.auth_id
        FROM public.users u
        WHERE b.user_id = u.user_id 
        AND b.auth_id IS NULL;
    END IF;
END $$;

-- 3. Create/Update 'create_booking_v3' to use UUID
CREATE OR REPLACE FUNCTION public.create_booking_v3(
    p_auth_id UUID, -- CHANGED from p_user_id BIGINT
    p_trip_id BIGINT,
    p_payment_method public.payment_method, -- e.g., 'cash', 'transfer', 'wallet'
    p_passengers_json JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_booking_id BIGINT;
    v_passenger RECORD;
    v_trip RECORD;
    v_total_price NUMERIC;
    v_base_price NUMERIC;
    v_passenger_count INT;
BEGIN
    -- 1. Verify trip exists and get price
    SELECT * INTO v_trip FROM public.trips WHERE trip_id = p_trip_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Trip not found');
    END IF;

    -- Calculate total price based on passengers count
    v_passenger_count := jsonb_array_length(p_passengers_json);
    v_base_price := v_trip.price;
    v_total_price := v_base_price * v_passenger_count;

    -- 2. Insert Booking (using auth_id)
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

    -- 3. Insert Passengers
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


-- 4. Recreate 'booking_details_view' using auth_id
DROP VIEW IF EXISTS public.booking_details_view CASCADE;

CREATE OR REPLACE VIEW public.booking_details_view AS
SELECT
    b.booking_id,
    b.auth_id, -- Expose auth_id
    u.full_name,
    b.booking_status,
    b.payment_status,
    b.total_price,
    b.refund_amount,
    b.cancellation_fee,
    b.booking_date,
    t.trip_id,
    t.departure_time,
    t.arrival_time,
    bc.class_name as bus_class,
    r.origin_city,
    r.destination_city,
    p.partner_id,
    p.company_name,
    d.driver_id,
    -- Passenger info
    (
        SELECT jsonb_agg(jsonb_build_object(
            'full_name', pa.full_name,
            'phone_number', pa.phone_number,
            'id_number', pa.id_number,
            'seat_id', pa.seat_id,
            'gender', pa.gender,
            'birth_date', pa.birth_date,
            'id_image', pa.id_image
        ))
        FROM public.passengers pa 
        WHERE pa.booking_id = b.booking_id
    ) as passengers,
    -- Rating info
    EXISTS(SELECT 1 FROM public.ratings ra WHERE ra.booking_id = b.booking_id) as has_rating
FROM
    public.bookings b
LEFT JOIN
    public.users u ON b.auth_id = u.auth_id -- Join on auth_id
JOIN
    public.trips t ON b.trip_id = t.trip_id
LEFT JOIN
    public.buses bu ON t.bus_id = bu.bus_id
LEFT JOIN
    public.bus_classes bc ON bu.bus_class_id = bc.bus_class_id
JOIN
    public.routes r ON t.route_id = r.route_id
JOIN
    public.partners p ON t.partner_id = p.partner_id
LEFT JOIN
    public.drivers d ON t.driver_id = d.driver_id;

-- 5. Enable RLS on bookings if not enabled
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- 6. Add policy for users to see their own bookings (using auth_id)
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
CREATE POLICY "Users can view own bookings" ON public.bookings
    FOR SELECT USING (auth_id = auth.uid());


-- ==========================================================
-- RATING SYSTEM UPDATES
-- ==========================================================

-- 7. Ensure 'auth_id' exists in 'ratings' table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ratings' AND column_name = 'auth_id') THEN
        ALTER TABLE public.ratings ADD COLUMN auth_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 8. Backfill auth_id from users table for ratings (Best Effort)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ratings' AND column_name = 'user_id') THEN
        UPDATE public.ratings r
        SET auth_id = u.auth_id
        FROM public.users u
        WHERE r.user_id = u.user_id 
        AND r.auth_id IS NULL;
    END IF;
END $$;

-- 9. Update 'can_user_rate_trip' to use auth_id
CREATE OR REPLACE FUNCTION public.can_user_rate_trip(
    p_auth_id UUID, -- CHANGED from p_user_id BIGINT
    p_trip_id BIGINT,
    p_booking_id BIGINT
) RETURNS BOOLEAN AS $$
DECLARE
    v_can_rate BOOLEAN := FALSE;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM public.bookings b
        JOIN public.trips t ON b.trip_id = t.trip_id
        WHERE b.booking_id = p_booking_id
        AND b.auth_id = p_auth_id -- Use auth_id
        AND b.trip_id = p_trip_id
        AND b.booking_status = 'completed'
        AND t.status = 'completed'
        AND t.arrival_time <= NOW()
        AND t.arrival_time >= NOW() - INTERVAL '30 days'
        AND NOT EXISTS (
            SELECT 1 FROM public.ratings 
            WHERE booking_id = p_booking_id
        )
    ) INTO v_can_rate;
    
    RETURN v_can_rate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Update 'create_rating' to use auth_id
CREATE OR REPLACE FUNCTION public.create_rating(
    p_auth_id UUID, -- CHANGED from p_user_id BIGINT
    p_trip_id BIGINT,
    p_booking_id BIGINT,
    p_driver_id BIGINT,
    p_partner_id BIGINT,
    p_stars INTEGER,
    p_service_rating INTEGER DEFAULT NULL,
    p_cleanliness_rating INTEGER DEFAULT NULL,
    p_punctuality_rating INTEGER DEFAULT NULL,
    p_comfort_rating INTEGER DEFAULT NULL,
    p_value_for_money_rating INTEGER DEFAULT NULL,
    p_comment TEXT DEFAULT NULL
) RETURNS BIGINT AS $$
DECLARE
    v_rating_id BIGINT;
    v_can_rate BOOLEAN;
BEGIN
    -- Check if user can rate this trip
    SELECT public.can_user_rate_trip(p_auth_id, p_trip_id, p_booking_id)
    INTO v_can_rate;
    
    IF NOT v_can_rate THEN
        RAISE EXCEPTION 'User is not eligible to rate this trip';
    END IF;
    
    -- Insert rating
    INSERT INTO public.ratings (
        auth_id, -- Use auth_id
        trip_id,
        booking_id,
        driver_id,
        partner_id,
        stars,
        service_rating,
        cleanliness_rating,
        punctuality_rating,
        comfort_rating,
        value_for_money_rating,
        comment
    ) VALUES (
        p_auth_id,
        p_trip_id,
        p_booking_id,
        p_driver_id,
        p_partner_id,
        p_stars,
        p_service_rating,
        p_cleanliness_rating,
        p_punctuality_rating,
        p_comfort_rating,
        p_value_for_money_rating,
        p_comment
    ) RETURNING rating_id INTO v_rating_id;
    
    RETURN v_rating_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;




-- ==========================================================
-- WALLET SYSTEM UPDATES
-- ==========================================================

-- 11. Ensure 'auth_id' exists in 'wallets' table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallets' AND column_name = 'auth_id') THEN
        ALTER TABLE public.wallets ADD COLUMN auth_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 12. Backfill auth_id from users table for wallets (Best Effort)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallets' AND column_name = 'user_id') THEN
        UPDATE public.wallets w
        SET auth_id = u.auth_id
        FROM public.users u
        WHERE w.user_id = u.user_id 
        AND w.auth_id IS NULL;
    END IF;
END $$;

-- 13. Enable RLS on wallets
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- 14. Add policy for users to see their own wallet (using auth_id)
DROP POLICY IF EXISTS "Users can view own wallet" ON public.wallets;
CREATE POLICY "Users can view own wallet" ON public.wallets
    FOR SELECT USING (auth_id = auth.uid());





-- ==========================================================
-- SUPPORT SYSTEM UPDATES
-- ==========================================================

-- 15. Ensure 'auth_id' exists in 'support_tickets' table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'support_tickets' AND column_name = 'auth_id') THEN
        ALTER TABLE public.support_tickets ADD COLUMN auth_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 16. Backfill auth_id from users table for support_tickets (Best Effort)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'support_tickets' AND column_name = 'user_id') THEN
        UPDATE public.support_tickets st
        SET auth_id = u.auth_id
        FROM public.users u
        WHERE st.user_id = u.user_id 
        AND st.auth_id IS NULL;
    END IF;
END $$;

-- 17. Enable RLS on support_tickets
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- 18. Add policy for users to see their own tickets (using auth_id)
DROP POLICY IF EXISTS "Users can view own tickets" ON public.support_tickets;
CREATE POLICY "Users can view own tickets" ON public.support_tickets
    FOR SELECT USING (auth_id = auth.uid());


-- ==========================================================
-- USER DEVICE TOKENS UPDATES
-- ==========================================================

-- 19. Ensure 'auth_id' exists in 'user_device_tokens' table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_device_tokens' AND column_name = 'auth_id') THEN
        ALTER TABLE public.user_device_tokens ADD COLUMN auth_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 20. Backfill auth_id from users table for user_device_tokens (Best Effort)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_device_tokens' AND column_name = 'user_id') THEN
        UPDATE public.user_device_tokens udt
        SET auth_id = u.auth_id
        FROM public.users u
        WHERE udt.user_id = u.user_id 
        AND udt.auth_id IS NULL;
    END IF;
END $$;

-- 21. Enable RLS on user_device_tokens
ALTER TABLE public.user_device_tokens ENABLE ROW LEVEL SECURITY;

-- 22. Add policy for users to see/edit their own tokens
DROP POLICY IF EXISTS "Users can manage own device tokens" ON public.user_device_tokens;
CREATE POLICY "Users can manage own device tokens" ON public.user_device_tokens
    FOR ALL USING (auth_id = auth.uid());

COMMIT;
