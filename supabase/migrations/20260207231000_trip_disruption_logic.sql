-- ========================================================
-- TRIP DISRUPTION LOGIC & ALGORITHMIC RESPONSE
-- Date: 2026-02-07
-- Purpose: Automated handling of Cancellations, Delays, Emergencies, and Passenger Transfers
-- ========================================================

BEGIN;

-- 0. DEPENDENCY: TRANSFER BOOKING (Ensuring Existence)
-- ========================================================
CREATE OR REPLACE FUNCTION public.transfer_booking_v1(
    p_booking_id BIGINT,
    p_new_trip_id BIGINT,
    p_notes TEXT DEFAULT 'نقل الحجز لرحلة بديلة'
)
RETURNS JSONB AS $$
DECLARE
    v_booking RECORD;
    v_old_trip RECORD;
    v_new_trip RECORD;
    v_passenger_count INT;
    v_new_capacity INT;
    v_occupied_count INT;
BEGIN
    -- 1. Context Check
    SELECT * INTO v_booking FROM public.bookings WHERE booking_id = p_booking_id;
    SELECT * INTO v_old_trip FROM public.trips WHERE trip_id = v_booking.trip_id;
    SELECT * INTO v_new_trip FROM public.trips WHERE trip_id = p_new_trip_id;
    
    IF v_new_trip.trip_id IS NULL THEN RETURN jsonb_build_object('success', false, 'message', 'New trip not found'); END IF;
    
    -- 2. Capacity Check
    SELECT count(*) INTO v_passenger_count FROM public.passengers WHERE booking_id = p_booking_id AND passenger_status != 'cancelled';
    
    SELECT b.capacity INTO v_new_capacity FROM public.buses b WHERE b.bus_id = v_new_trip.bus_id;
    SELECT count(*) INTO v_occupied_count FROM public.passengers WHERE trip_id = p_new_trip_id AND passenger_status != 'cancelled';
    
    IF (v_occupied_count + v_passenger_count) > v_new_capacity THEN
        RETURN jsonb_build_object('success', false, 'message', 'لا توجد سعة كافية في الرحلة الجديدة');
    END IF;

    -- 3. Execute Transfer
    UPDATE public.bookings 
    SET trip_id = p_new_trip_id,
        updated_at = NOW()
    WHERE booking_id = p_booking_id;

    UPDATE public.passengers
    SET trip_id = p_new_trip_id,
        seat_id = NULL -- Release old seats
    WHERE booking_id = p_booking_id AND passenger_status != 'cancelled';

    -- 4. Notify the Passenger
    INSERT INTO public.notifications (auth_id, title, message, type, priority)
    VALUES (
        v_booking.auth_id,
        'تعديل على حجزك 🔄',
        format('تم نقل حجزك رقم #%s من الرحلة السابقة إلى رحلة جديدة تنطلق في %s.', p_booking_id, v_new_trip.departure_time),
        'booking', 'high'
    );

    -- 5. Audit Log
    INSERT INTO public.booking_ledger (booking_id, entry_type, amount, note)
    VALUES (p_booking_id, 'adjustment', 0, format('نقل حجز: من رحلة #%s إلى #%s.', v_old_trip.trip_id, p_new_trip_id));

    RETURN jsonb_build_object('success', true, 'message', 'تم نقل الحجز بنجاح');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 1. HELPER: BROADCAST ALERT
-- ========================================================
CREATE OR REPLACE FUNCTION public.broadcast_trip_alert(
    p_trip_id BIGINT,
    p_title TEXT,
    p_message TEXT,
    p_priority TEXT DEFAULT 'medium'
)
RETURNS VOID AS $$
DECLARE
    v_booking RECORD;
BEGIN
    FOR v_booking IN (
        SELECT auth_id 
        FROM public.bookings 
        WHERE trip_id = p_trip_id AND booking_status = 'confirmed'
    ) LOOP
        INSERT INTO public.notifications (auth_id, title, message, type, priority, action_url)
        VALUES (
            v_booking.auth_id,
            p_title,
            p_message,
            'trip',
            p_priority, 
            '/trips/' || p_trip_id
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. HELPER: FIND ALTERNATIVES (New Feature)
-- ========================================================
CREATE OR REPLACE FUNCTION public.find_alternative_trips(
    p_original_trip_id BIGINT
)
RETURNS TABLE (
    trip_id BIGINT,
    departure_time TIMESTAMP WITH TIME ZONE,
    available_seats INTEGER,
    price_difference NUMERIC,
    route_name TEXT
) AS $$
DECLARE
    v_origin_route_id BIGINT;
    v_origin_price NUMERIC;
    v_required_seats INTEGER;
BEGIN
    -- Get Context
    SELECT route_id, base_price INTO v_origin_route_id, v_origin_price 
    FROM public.trips WHERE trip_id = p_original_trip_id;

    SELECT count(*) INTO v_required_seats 
    FROM public.passengers 
    WHERE trip_id = p_original_trip_id AND passenger_status = 'confirmed';

    RETURN QUERY
    SELECT 
        t.trip_id,
        t.departure_time,
        (b.capacity - (SELECT count(*)::int FROM public.passengers p WHERE p.trip_id = t.trip_id AND p.passenger_status = 'confirmed'))::INTEGER as available_seats,
        (t.base_price - v_origin_price) as price_difference,
        (r.origin_city || ' -> ' || r.destination_city) as route_name
    FROM public.trips t
    JOIN public.buses b ON t.bus_id = b.bus_id
    JOIN public.routes r ON t.route_id = r.route_id
    WHERE t.route_id = v_origin_route_id
      AND t.departure_time > now()
      AND t.status = 'scheduled'
      AND t.trip_id != p_original_trip_id
      -- Optional: Filter by capacity? 
      -- AND (b.capacity - ...) >= v_required_seats
    ORDER BY 
        t.departure_time ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. HELPER: TRANSFER PASSENGERS
-- ========================================================
CREATE OR REPLACE FUNCTION public.transfer_passengers(
    p_old_trip_id BIGINT,
    p_new_trip_id BIGINT,
    p_reason TEXT DEFAULT 'Operational Transfer'
)
RETURNS JSONB AS $$
DECLARE
    v_old_trip RECORD;
    v_new_trip RECORD;
    v_booking RECORD;
    v_passenger_count INTEGER;
    v_new_capacity INTEGER;
    v_success_count INTEGER := 0;
    v_fail_count INTEGER := 0;
    v_available_seats_ids BIGINT[];
    v_seat_idx INTEGER := 1;
    v_new_bus_id BIGINT;
BEGIN
    -- Validate Trips
    SELECT * INTO v_old_trip FROM public.trips WHERE trip_id = p_old_trip_id;
    SELECT * INTO v_new_trip FROM public.trips WHERE trip_id = p_new_trip_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'One or both trips not found');
    END IF;

    -- Check Total Capacity First
    SELECT count(*) INTO v_passenger_count 
    FROM public.passengers 
    WHERE trip_id = p_old_trip_id AND passenger_status = 'confirmed';

    SELECT b.capacity, b.bus_id INTO v_new_capacity, v_new_bus_id
    FROM public.trips t 
    JOIN public.buses b ON t.bus_id = b.bus_id 
    WHERE t.trip_id = p_new_trip_id;

    IF v_passenger_count > v_new_capacity THEN
         RETURN jsonb_build_object('success', false, 'message', format('السعة غير كافية. الركاب: %s, السعة: %s', v_passenger_count, v_new_capacity));
    END IF;

    -- 1. Fetch available seats for the new trip
    SELECT array_agg(seat_id ORDER BY seat_number) INTO v_available_seats_ids
    FROM public.seats 
    WHERE bus_id = v_new_bus_id 
    AND seat_id NOT IN (
        SELECT seat_id FROM public.passengers 
        WHERE trip_id = p_new_trip_id AND seat_id IS NOT NULL AND passenger_status != 'cancelled'
    );

    -- Calculate Price Difference (Per Ticket)
    -- If Old > New: Refund difference.
    -- If New > Old: Absorbed by company (Upgrade).
    DECLARE
        v_price_diff NUMERIC := v_old_trip.base_price - v_new_trip.base_price;
        v_refund_amount NUMERIC := 0;
    BEGIN
        -- Loop through active bookings
        FOR v_booking IN (
            SELECT booking_id, auth_id, total_price, payment_status FROM public.bookings 
            WHERE trip_id = p_old_trip_id AND booking_status = 'confirmed'
        ) LOOP
            DECLARE
                v_booking_passengers_count INTEGER;
                v_total_booking_refund NUMERIC;
            BEGIN
                -- 1. Execute Transfer (Moves booking and clears old seats)
                PERFORM public.transfer_booking_v1(
                    v_booking.booking_id, 
                    p_new_trip_id, 
                    'Automatic Transfer: ' || p_reason
                );
                
                -- 2. Smart Seat Assignment (Tries to assign next available seat)
                DECLARE
                    v_p RECORD;
                BEGIN
                    FOR v_p IN (SELECT passenger_id FROM public.passengers WHERE booking_id = v_booking.booking_id AND passenger_status != 'cancelled') LOOP
                        IF v_available_seats_ids IS NOT NULL AND v_seat_idx <= array_length(v_available_seats_ids, 1) THEN
                            UPDATE public.passengers SET seat_id = v_available_seats_ids[v_seat_idx] WHERE passenger_id = v_p.passenger_id;
                            v_seat_idx := v_seat_idx + 1;
                        END IF;
                    END LOOP;
                END;

                -- 3. Handle Price Difference Refund (Scalable by Passenger Count)
                IF v_price_diff > 0 AND v_booking.payment_status = 'paid' THEN
                    -- Get the number of confirmed (transferred) passengers in this booking
                    SELECT count(*)::int INTO v_booking_passengers_count 
                    FROM public.passengers 
                    WHERE booking_id = v_booking.booking_id AND passenger_status = 'confirmed';

                    v_total_booking_refund := v_price_diff * v_booking_passengers_count;

                    IF v_total_booking_refund > 0 THEN
                        PERFORM public.process_wallet_transaction_uuid(
                            v_booking.auth_id,
                            'deposit',
                            v_total_booking_refund,
                            v_booking.booking_id::text,
                            format('استرداد فرق السعر لـ %s ركاب وجهة #%s', v_booking_passengers_count, p_new_trip_id)
                        );
                        
                        -- Update booking record
                        UPDATE public.bookings 
                        SET refund_amount = COALESCE(refund_amount, 0) + v_total_booking_refund,
                            payment_status = 'partially_refunded'
                        WHERE booking_id = v_booking.booking_id;

                        -- Ledger update
                        INSERT INTO public.booking_ledger (booking_id, entry_type, amount, note)
                        VALUES (v_booking.booking_id, 'refund', v_total_booking_refund, 'فرق سعر رحلة بعد النقل');
                    END IF;
                END IF;

                v_success_count := v_success_count + 1;
            EXCEPTION WHEN OTHERS THEN
                v_fail_count := v_fail_count + 1;
            END;
        END LOOP;
    END;

    -- Update Old Trip Status if empty
    -- UPDATE public.trips SET status = 'cancelled' WHERE trip_id = p_old_trip_id; 

    RETURN jsonb_build_object(
        'success', true, 
        'transferred', v_success_count, 
        'failed', v_fail_count,
        'message', format('تم نقل %s حجوزات بنجاح مع توزيع المقاعد آلياً ومعالجة فرق السعر.', v_success_count)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. MASTER DISRUPTION HANDLER
-- ========================================================
CREATE OR REPLACE FUNCTION public.handle_trip_disruption(
    p_trip_id BIGINT,
    p_action_type TEXT, 
    p_reason TEXT DEFAULT NULL,
    p_delay_minutes INTEGER DEFAULT NULL,
    p_new_eta TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_transfer_trip_id BIGINT DEFAULT NULL -- New Parameter
)
RETURNS JSONB AS $$
DECLARE
    v_trip RECORD;
    v_notification_title TEXT;
    v_notification_body TEXT;
BEGIN
    -- Fetch Trip
    SELECT * INTO v_trip FROM public.trips WHERE trip_id = p_trip_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Trip not found');
    END IF;

    -- A. HANDLE CANCELLATION
    IF p_action_type = 'cancel' THEN
        IF p_reason IS NULL THEN
            RETURN jsonb_build_object('success', false, 'message', 'Reason is required');
        END IF;

        UPDATE public.trips 
        SET status = 'cancelled', 
            cancellation_reason = p_reason,
            updated_at = now()
        WHERE trip_id = p_trip_id;
        
        RETURN jsonb_build_object('success', true, 'status', 'cancelled');

    -- B. HANDLE DELAY
    ELSIF p_action_type = 'delay' THEN
        -- ... (Same as before)
        IF p_delay_minutes IS NULL THEN
            RETURN jsonb_build_object('success', false, 'message', 'Delay minutes required');
        END IF;

        UPDATE public.trips 
        SET delay_minutes = p_delay_minutes,
            status = CASE WHEN p_delay_minutes > 15 AND status = 'scheduled' THEN 'delayed'::public.trip_status ELSE status END,
            arrival_time = (departure_time + (interval '1 minute' * p_delay_minutes))
        WHERE trip_id = p_trip_id;

        v_notification_title := 'تحديث حالة الرحلة: تأخير 🕒';
        v_notification_body := format('نود إبلاغك بوجود تأخير في رحلتك لمدة %s دقيقة.', p_delay_minutes);
        PERFORM public.broadcast_trip_alert(p_trip_id, v_notification_title, v_notification_body, 'medium');
        
        RETURN jsonb_build_object('success', true, 'status', 'delayed');

    -- C. HANDLE DIVERSION
    ELSIF p_action_type = 'divert' THEN
         -- ... (Same as before)
         UPDATE public.trips 
        SET is_diverted = true,
            status = 'diverted',
            cancellation_reason = COALESCE(p_reason, 'Route diversion') 
        WHERE trip_id = p_trip_id;

        v_notification_title := 'تغيير في مسار الرحلة 🔀';
        v_notification_body := format('تم تغيير مسار الرحلة: %s.', p_reason);
        PERFORM public.broadcast_trip_alert(p_trip_id, v_notification_title, v_notification_body, 'high');

        RETURN jsonb_build_object('success', true, 'status', 'diverted');

    -- D. HANDLE EMERGENCY
    ELSIF p_action_type = 'emergency' THEN
         -- ... (Same as before)
         UPDATE public.trips 
        SET status = 'emergency',
            cancellation_reason = p_reason
        WHERE trip_id = p_trip_id;

        v_notification_title := '🚨 تنبيه طارئ';
        v_notification_body := format('تنبيه هام بخصوص الرحلة: %s.', p_reason);
        PERFORM public.broadcast_trip_alert(p_trip_id, v_notification_title, v_notification_body, 'high');

        RETURN jsonb_build_object('success', true, 'status', 'emergency');

    -- E. HANDLE TRANSFER (New)
    ELSIF p_action_type = 'transfer' THEN
        IF p_transfer_trip_id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'message', 'Target trip ID required for transfer');
        END IF;

        RETURN public.transfer_passengers(p_trip_id, p_transfer_trip_id, p_reason);

    ELSE
        RETURN jsonb_build_object('success', false, 'message', 'Invalid action type');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
