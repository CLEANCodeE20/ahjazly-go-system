-- =============================================
-- FIX: CANCELLATION LOGIC CALCULATION
-- تصحيح منطق حساب مبالغ الإلغاء
-- =============================================

CREATE OR REPLACE FUNCTION public.cancel_booking_rpc(
    p_booking_id BIGINT,
    p_reason TEXT DEFAULT 'Cancelled by user',
    p_confirm BOOLEAN DEFAULT false
)
RETURNS JSONB AS $$
DECLARE
    v_booking RECORD;
    v_trip RECORD;
    v_policy_id BIGINT;
    v_hours_before NUMERIC;
    v_rule RECORD;
    v_refund_amount NUMERIC;
    v_fee NUMERIC;
    v_current_time_local TIMESTAMP;
    v_result JSONB;
BEGIN
    -- 1. Get booking and trip details
    SELECT b.* INTO v_booking FROM public.bookings b WHERE b.booking_id = p_booking_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Booking not found');
    END IF;

    IF v_booking.booking_status = 'cancelled' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Booking is already cancelled');
    END IF;

    SELECT t.* INTO v_trip FROM public.trips t WHERE t.trip_id = v_booking.trip_id;
    
    -- 2. Calculate hours before departure (Robust Timezone Handling)
    v_current_time_local := now() AT TIME ZONE 'Asia/Aden';
    v_hours_before := FLOOR(extract(epoch from (v_trip.departure_time - v_current_time_local)) / 3600);

    -- 3. Determine policy
    v_policy_id := v_booking.cancel_policy_id;
    
    IF v_policy_id IS NULL THEN
        -- Try default policy
        SELECT cancel_policy_id INTO v_policy_id 
        FROM public.cancel_policies 
        WHERE partner_id = v_trip.partner_id AND is_default = true 
        AND is_active = true
        LIMIT 1;
        
        -- Fallback to any active policy
        IF v_policy_id IS NULL THEN
            SELECT cancel_policy_id INTO v_policy_id 
            FROM public.cancel_policies 
            WHERE partner_id = v_trip.partner_id AND is_active = true
            ORDER BY priority DESC, created_at DESC
            LIMIT 1;
        END IF;
    END IF;

    -- 4. Find matching rule
    SELECT * INTO v_rule 
    FROM public.cancel_policy_rules 
    WHERE cancel_policy_id = v_policy_id 
      AND (min_hours_before_departure IS NULL OR v_hours_before >= min_hours_before_departure)
      AND is_active = true
    ORDER BY min_hours_before_departure DESC
    LIMIT 1;

    -- ========================================================
    -- ✅ FIXED FINANCIAL CALCULATION (STRATEGY: BOUNDED DEDUCTION)
    -- ========================================================
    IF NOT FOUND THEN
        -- Default: No refund if no rule matches
        v_refund_amount := 0;
    ELSE
        DECLARE
            v_perc NUMERIC := COALESCE(v_rule.refund_percentage, 0);
            v_const_fee NUMERIC := COALESCE(v_rule.cancellation_fee, 0);
        BEGIN
            -- 1. Calculate Base Refund based on percentage
            v_refund_amount := (v_booking.total_price * v_perc / 100.0);
            
            -- 2. Subtract Fixed Fee (if any)
            v_refund_amount := v_refund_amount - v_const_fee;
        END;
    END IF;

    -- 3. Clamp Refund (Cannot be negative)
    IF v_refund_amount < 0 THEN 
        v_refund_amount := 0; 
    END IF;

    -- 4. Calculate Fee (The remainder of the total price)
    -- This ensures Total Price = Refund + Fee always.
    v_fee := v_booking.total_price - v_refund_amount;

    v_result := jsonb_build_object(
        'success', true,
        'booking_id', p_booking_id,
        'total_price', v_booking.total_price,
        'hours_before_departure', v_hours_before,
        'refund_amount', v_refund_amount,
        'cancellation_fee', v_fee,
        'refund_percentage', COALESCE(v_rule.refund_percentage, 0),
        'debug_policy_id', v_policy_id
    );

    -- 5. Atomic Execution
    IF p_confirm THEN
        DECLARE
            v_canceller_id BIGINT;
        BEGIN
            -- Identify canceller
            SELECT user_id INTO v_canceller_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1;
            v_canceller_id := COALESCE(v_canceller_id, v_booking.user_id);

            UPDATE public.bookings 
            SET 
                booking_status = 'cancelled',
                cancel_reason = p_reason,
                cancel_timestamp = now(),
                refund_amount = v_refund_amount,
                cancellation_fee = v_fee,
                payment_status = CASE WHEN payment_status = 'paid' THEN 'refunded'::payment_status ELSE payment_status END
            WHERE booking_id = p_booking_id;

            -- Release seats
            UPDATE public.passengers 
            SET passenger_status = 'cancelled'
            WHERE booking_id = p_booking_id;

            -- Audit record
            INSERT INTO public.booking_cancellations (
                booking_id, cancelled_by_user_id, cancel_policy_id, rule_id, reason,
                hours_before_departure, original_total, refund_percentage,
                refund_amount, cancellation_fee, refund_status
            ) VALUES (
                p_booking_id, v_canceller_id, v_policy_id, v_rule.rule_id, p_reason,
                v_hours_before, v_booking.total_price, COALESCE(v_rule.refund_percentage, 0),
                v_refund_amount, v_fee,
                CASE WHEN v_booking.payment_status = 'paid' THEN 'pending' ELSE 'n/a' END
            );

            -- Refund record
            IF v_booking.payment_status = 'paid' AND v_refund_amount > 0 THEN
                INSERT INTO public.refunds (
                    booking_id, user_id, refund_amount, refund_method, status
                ) VALUES (
                    p_booking_id, v_booking.user_id, v_refund_amount, v_booking.payment_method::text, 'pending'
                );
            END IF;
        END;
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
