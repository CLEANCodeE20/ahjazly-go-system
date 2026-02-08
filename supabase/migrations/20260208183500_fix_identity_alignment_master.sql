-- ==========================================================
-- FINAL IDENTITY ALIGNMENT & BOOKING FLOW RECONCILIATION
-- Date: 2026-02-08
-- Purpose: Fix "column user_id does not exist" by standardizing
--          all lingering triggers and functions to use auth_id.
-- ==========================================================

BEGIN;

-- 1. Ensure 'cash' exists in the payment_method enum (Safety)
DO $$
BEGIN
    ALTER TYPE public.payment_method ADD VALUE IF NOT EXISTS 'cash';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. REBUILD handle_new_user (The Universal Auth Trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
    v_is_super BOOLEAN;
    v_role public.app_role;
    v_gender public.gender_type;
BEGIN
    -- Determine role
    v_is_super := (new.email LIKE '%@admin.com') OR (new.email LIKE '%@ahjazly.com');
    v_role := CASE WHEN v_is_super THEN 'SUPERUSER'::public.app_role ELSE 'TRAVELER'::public.app_role END;

    -- Map Gender
    CASE (new.raw_user_meta_data->>'gender')
        WHEN 'M' THEN v_gender := 'male'::public.gender_type;
        WHEN 'F' THEN v_gender := 'female'::public.gender_type;
        ELSE v_gender := NULL;
    END CASE;

    -- Update Users Table (Gold Standard uses auth_id)
    INSERT INTO public.users (auth_id, full_name, email, phone_number, gender, account_status)
    VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', 'New User'), new.email, new.raw_user_meta_data->>'phone_number', v_gender, 'active')
    ON CONFLICT (auth_id) DO UPDATE SET 
        email = new.email,
        full_name = EXCLUDED.full_name,
        phone_number = EXCLUDED.phone_number,
        gender = EXCLUDED.gender;

    -- Update user_roles (FIXED: Uses auth_id instead of user_id)
    INSERT INTO public.user_roles (auth_id, role, partner_id)
    VALUES (new.id, v_role, NULL)
    ON CONFLICT (auth_id, role) DO NOTHING;

    -- Ensure Wallet exists
    INSERT INTO public.wallets (auth_id)
    VALUES (new.id)
    ON CONFLICT (auth_id) DO NOTHING;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. REBUILD notify_booking_changes (FIXED: Columns Alignment)
CREATE OR REPLACE FUNCTION public.notify_booking_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_trip_info RECORD;
    v_user_fullname TEXT;
    v_partner_admin_auth_id UUID;
BEGIN
    -- Fetch Trip Info
    SELECT t.trip_id, p.partner_id, r.origin_city, r.destination_city
    INTO v_trip_info
    FROM public.trips t
    JOIN public.partners p ON t.partner_id = p.partner_id
    JOIN public.routes r ON t.route_id = r.route_id
    WHERE t.trip_id = COALESCE(NEW.trip_id, OLD.trip_id);

    -- Fetch User Info (Using auth_id)
    SELECT full_name INTO v_user_fullname 
    FROM public.users 
    WHERE auth_id = COALESCE(NEW.auth_id, OLD.auth_id);

    -- Find Partner Admin (FIXED: Uses auth_id from user_roles)
    SELECT ur.auth_id INTO v_partner_admin_auth_id
    FROM public.user_roles ur
    WHERE ur.partner_id = v_trip_info.partner_id
    AND ur.role IN ('PARTNER_ADMIN', 'manager')
    LIMIT 1;

    -- INSERT Notifications
    IF (TG_OP = 'INSERT') THEN
        -- To Traveler
        INSERT INTO public.notifications (auth_id, title, message, type, priority)
        VALUES (NEW.auth_id, 'تم استلام طلبك', 'جاري معالجة طلب حجزك للرحلة.', 'booking', 'high');
        
        -- To Partner
        IF v_partner_admin_auth_id IS NOT NULL THEN
            INSERT INTO public.notifications (auth_id, title, message, type, priority, partner_id)
            VALUES (v_partner_admin_auth_id, 'طلب حجز جديد', 'لديك طلب حجز جديد قادم من ' || COALESCE(v_user_fullname, 'مسافر'), 'booking', 'high', v_trip_info.partner_id);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. FIX create_booking_v3 (The core problematic RPC)
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
    -- 1. Trip Validation
    SELECT * INTO v_trip FROM public.trips WHERE trip_id = p_trip_id;
    IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'message', 'Trip not found'); END IF;

    -- 2. Seat Availability
    FOR v_passenger IN SELECT * FROM jsonb_to_recordset(p_passengers_json) AS x(seat_id bigint)
    LOOP
        IF EXISTS (SELECT 1 FROM public.passengers WHERE trip_id = p_trip_id AND seat_id = v_passenger.seat_id AND passenger_status = 'active') THEN
            RETURN jsonb_build_object('success', false, 'message', 'One or more seats are already booked.');
        END IF;
    END LOOP;

    -- 3. Price Calculation (FIXED: Uses base_price)
    v_passenger_count := jsonb_array_length(p_passengers_json);
    v_total_price := v_trip.base_price * v_passenger_count;

    -- 4. Insert Booking (FIXED: Uses auth_id)
    INSERT INTO public.bookings (auth_id, trip_id, booking_date, booking_status, payment_method, payment_status, total_price)
    VALUES (p_auth_id, p_trip_id, NOW(), 'pending', p_payment_method, 'pending', v_total_price)
    RETURNING booking_id INTO v_booking_id;

    -- 5. Insert Passengers
    FOR v_passenger IN SELECT * FROM jsonb_to_recordset(p_passengers_json) AS x(full_name text, phone_number text, id_number text, seat_id bigint, gender public.gender_type, birth_date date, id_image text)
    LOOP
        INSERT INTO public.passengers (booking_id, trip_id, seat_id, full_name, phone_number, id_number, gender, birth_date, id_image, passenger_status)
        VALUES (v_booking_id, p_trip_id, v_passenger.seat_id, v_passenger.full_name, v_passenger.phone_number, v_passenger.id_number, v_passenger.gender, v_passenger.birth_date, v_passenger.id_image, 'active');
    END LOOP;

    RETURN jsonb_build_object('success', true, 'booking_id', v_booking_id, 'message', 'Booking created successfully');
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. REBUILD RATING NOTIFICATION ENGINE (FIXED: Uses auth_id)
CREATE OR REPLACE FUNCTION public.notify_partner_on_new_rating()
RETURNS TRIGGER AS $$
DECLARE
    v_trip_info TEXT;
    v_admin_auth_id UUID;
BEGIN
    SELECT r.origin_city || ' - ' || r.destination_city INTO v_trip_info
    FROM public.trips t JOIN public.routes r ON t.route_id = r.route_id
    WHERE t.trip_id = NEW.trip_id;
    
    FOR v_admin_auth_id IN (
        SELECT auth_id FROM public.user_roles 
        WHERE partner_id = NEW.partner_id AND role IN ('PARTNER_ADMIN', 'manager')
    ) LOOP
        INSERT INTO public.notifications (auth_id, title, message, type, partner_id)
        VALUES (v_admin_auth_id, 'تقييم جديد', 'تم استلام تقييم ' || NEW.stars || ' نجوم للرحلة: ' || v_trip_info, 'trip', NEW.partner_id);
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. REBUILD REFUND NOTIFICATION ENGINE (FIXED: Uses auth_id)
CREATE OR REPLACE FUNCTION public.notify_refund_request()
RETURNS TRIGGER AS $$
DECLARE
    v_partner_id BIGINT;
    v_admin_auth_id UUID;
BEGIN
    SELECT t.partner_id INTO v_partner_id 
    FROM public.bookings b 
    JOIN public.trips t ON b.trip_id = t.trip_id 
    WHERE b.booking_id = NEW.booking_id;
    
    FOR v_admin_auth_id IN (
        SELECT auth_id FROM public.user_roles 
        WHERE partner_id = v_partner_id AND role IN ('PARTNER_ADMIN', 'manager')
    ) LOOP
        INSERT INTO public.notifications (auth_id, title, message, type, partner_id)
        VALUES (v_admin_auth_id, 'طلب استرداد', format('هناك طلب استرداد جديد للحجز #%s.', NEW.booking_id), 'booking', v_partner_id);
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RE-ATTACH ALL TRIGGERS
DROP TRIGGER IF EXISTS trigger_notify_booking_changes ON public.bookings;
CREATE TRIGGER trigger_notify_booking_changes AFTER INSERT ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.notify_booking_changes();

DROP TRIGGER IF EXISTS notify_partner_on_rating_trigger ON public.ratings;
CREATE TRIGGER notify_partner_on_rating_trigger AFTER INSERT ON public.ratings FOR EACH ROW EXECUTE FUNCTION public.notify_partner_on_new_rating();

DROP TRIGGER IF EXISTS tr_notify_refund_request ON public.refunds;
CREATE TRIGGER tr_notify_refund_request AFTER INSERT ON public.refunds FOR EACH ROW EXECUTE FUNCTION public.notify_refund_request();

COMMIT;

