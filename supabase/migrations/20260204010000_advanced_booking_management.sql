-- ========================================================
-- ADVANCED BOOKING MANAGEMENT: PARTIAL CANCELLATION, TRANSFERS, CHECK-IN
-- ========================================================

BEGIN;

-- 1. Extend Passengers Table
ALTER TABLE public.passengers ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.passengers ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. RPC: Update Passenger Details (تعديل بيانات المسافر)
CREATE OR REPLACE FUNCTION public.update_passenger_details_v1(
    p_passenger_id BIGINT,
    p_full_name VARCHAR,
    p_id_number VARCHAR,
    p_phone_number VARCHAR,
    p_gender public.gender_type,
    p_birth_date DATE,
    p_seat_id BIGINT DEFAULT NULL -- Optional seat change
)
RETURNS JSONB AS $$
BEGIN
    UPDATE public.passengers
    SET full_name = p_full_name,
        id_number = p_id_number,
        phone_number = p_phone_number,
        gender = p_gender,
        birth_date = p_birth_date,
        seat_id = COALESCE(p_seat_id, seat_id)
    WHERE passenger_id = p_passenger_id;
    
    RETURN jsonb_build_object('success', true, 'message', 'تم تحديث البيانات بنجاح');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RPC: Toggle Passenger Check-in (تحضير الركاب - صعود الحافلة)
CREATE OR REPLACE FUNCTION public.toggle_passenger_checkin_v1(
    p_passenger_id BIGINT,
    p_is_checked_in BOOLEAN
)
RETURNS JSONB AS $$
BEGIN
    UPDATE public.passengers
    SET passenger_status = CASE WHEN p_is_checked_in THEN 'checked_in' ELSE 'active' END,
        checked_in_at = CASE WHEN p_is_checked_in THEN NOW() ELSE NULL END
    WHERE passenger_id = p_passenger_id;
    
    RETURN jsonb_build_object('success', true, 'checked_in', p_is_checked_in);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RPC: Partial Cancel Booking (الإلغاء الجزئي لمسافرين محددين)
CREATE OR REPLACE FUNCTION public.partial_cancel_booking_v1(
    p_booking_id BIGINT,
    p_passenger_ids BIGINT[], -- Array of passenger IDs to cancel
    p_reason TEXT DEFAULT 'إلغاء جزئي بقيمة مستردة'
)
RETURNS JSONB AS $$
DECLARE
    v_booking RECORD;
    v_trip RECORD;
    v_passenger_count INT;
    v_cancelling_count INT;
    v_unit_price NUMERIC;
    v_refund_amount NUMERIC;
    v_cancellation_fee NUMERIC := 0.00; -- Can be expanded with policy logic
    v_p_id BIGINT;
    v_active_count INT;
BEGIN
    -- 1. Fetch Booking Context
    SELECT * INTO v_booking FROM public.bookings WHERE booking_id = p_booking_id;
    IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'message', 'Booking not found'); END IF;
    
    -- 2. Calculate counts and unit price
    SELECT count(*) INTO v_passenger_count FROM public.passengers WHERE booking_id = p_booking_id;
    v_unit_price := v_booking.total_price / v_passenger_count;
    v_cancelling_count := array_length(p_passenger_ids, 1);
    
    -- 3. Calculate Refund (Simple logic: 10% fee if less than 24h, placeholder for now)
    v_refund_amount := v_unit_price * v_cancelling_count;
    
    -- 4. Execute Cancellation for each passenger
    FOREACH v_p_id IN ARRAY p_passenger_ids LOOP
        UPDATE public.passengers 
        SET passenger_status = 'cancelled',
            cancelled_at = NOW()
        WHERE passenger_id = v_p_id AND booking_id = p_booking_id;
    END LOOP;

    -- 5. Refund to Wallet if booking was paid
    IF v_booking.payment_status = 'paid' OR v_booking.payment_status = 'partially_refunded' THEN
        PERFORM public.process_wallet_transaction_uuid(
            v_booking.auth_id,
            'deposit',
            v_refund_amount,
            p_booking_id::text,
            format('استرداد جزئي (إلغاء عدد %s مقاعد) للحجز #%s', v_cancelling_count, p_booking_id)
        );
        
        -- Update booking refund totals and state
        UPDATE public.bookings 
        SET refund_amount = COALESCE(refund_amount, 0) + v_refund_amount,
            payment_status = 'partially_refunded',
            updated_at = NOW()
        WHERE booking_id = p_booking_id;

        -- Create Ledger Entry for Accounting
        INSERT INTO public.booking_ledger (booking_id, partner_id, entry_type, amount, note)
        VALUES (p_booking_id, v_booking.partner_id, 'refund', v_refund_amount, format('إلغاء جزئي لعدد %s ركاب', v_cancelling_count));
    END IF;

    -- 6. Check if ALL passengers are now cancelled
    SELECT count(*) INTO v_active_count 
    FROM public.passengers 
    WHERE booking_id = p_booking_id AND passenger_status IN ('active', 'checked_in');

    IF v_active_count = 0 THEN
        UPDATE public.bookings 
        SET booking_status = 'cancelled',
            payment_status = 'refunded', -- Fully refunded now
            cancel_reason = format('إلغاء كامل (جزئي متكرر): %s', p_reason),
            cancel_timestamp = NOW()
        WHERE booking_id = p_booking_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true, 
        'refunded', v_refund_amount, 
        'remaining_passengers', v_active_count,
        'full_cancelled', (v_active_count = 0)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RPC: Transfer Booking to Trip (نقل الحجز لرحلة أخرى - Swapping)
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
        seat_id = NULL -- Release old seats, requires re-assignment in the new trip layout
    WHERE booking_id = p_booking_id AND passenger_status != 'cancelled';

    -- 4. Notify the Passenger (إشعار العميل بنقل الرحلة)
    INSERT INTO public.notifications (auth_id, title, message, type, priority)
    VALUES (
        v_booking.auth_id,
        'تعديل على حجزك 🔄',
        format('تم نقل حجزك رقم #%s من الرحلة السابقة إلى رحلة جديدة تنطلق من %s إلى %s في تمام الساعة %s.', 
               p_booking_id, v_new_trip.departure_time, v_new_trip.destination_city, to_char(v_new_trip.departure_time, 'HH:MI AM')),
        'booking', 'high'
    );

    -- 5. Audit Log (سجل العمليات الموثق)
    INSERT INTO public.booking_ledger (booking_id, entry_type, amount, note)
    VALUES (p_booking_id, 'adjustment', 0, format('نقل حجز حقيقي: من رحلة #%s إلى #%s. تم تحرير المقاعد القديمة للتوفر.', v_old_trip.trip_id, p_new_trip_id));

    RETURN jsonb_build_object('success', true, 'message', 'تم نقل الحجز بنجاح بنسبة 100%');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
