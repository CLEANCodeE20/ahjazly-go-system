-- ========================================================
-- FIX CANCELLATION LOGIC (V2) - FALLBACK TO POLICY REFUND %
-- ========================================================

CREATE OR REPLACE FUNCTION public.cancel_booking_rpc(
    p_booking_id BIGINT,
    p_reason TEXT DEFAULT 'Cancelled by user',
    p_confirm BOOLEAN DEFAULT false
)
RETURNS JSONB AS $$
DECLARE
    v_booking RECORD;
    v_trip RECORD;
    v_policy RECORD;
    v_policy_id BIGINT;
    v_hours_before NUMERIC;
    v_rule RECORD;
    v_refund_amount NUMERIC;
    v_fee NUMERIC;
    v_refund_pct NUMERIC;
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
    
    -- 2. Calculate hours before departure
    v_hours_before := extract(epoch from (v_trip.departure_time - now())) / 3600;

    -- 3. Determine policy
    v_policy_id := v_booking.cancel_policy_id;
    IF v_policy_id IS NULL THEN
        SELECT cancel_policy_id INTO v_policy_id 
        FROM public.cancel_policies 
        WHERE partner_id = v_trip.partner_id AND is_default = true 
        LIMIT 1;
    END IF;

    -- Get policy details for fallback refund percentage
    SELECT * INTO v_policy FROM public.cancel_policies WHERE cancel_policy_id = v_policy_id;

    -- 4. Find matching rule
    SELECT * INTO v_rule 
    FROM public.cancel_policy_rules 
    WHERE cancel_policy_id = v_policy_id 
      AND (min_hours_before_departure IS NULL OR v_hours_before >= min_hours_before_departure)
      AND (max_hours_before_departure IS NULL OR v_hours_before < max_hours_before_departure)
      AND is_active = true
    ORDER BY min_hours_before_departure DESC
    LIMIT 1;

    -- 5. Calculate refund percentage
    -- If no rule matches, it means the cancellation is likely very early (more than the max hours in rules)
    -- In this case, we fallback to the policy's default refund percentage (usually 100%)
    IF v_rule.rule_id IS NOT NULL THEN
        v_refund_pct := v_rule.refund_percentage;
        v_fee := v_rule.cancellation_fee + (v_booking.total_price * (100 - v_refund_pct) / 100.0);
    ELSE
        -- Fallback to policy default (e.g., 100% if cancelled very early)
        v_refund_pct := COALESCE(v_policy.refund_percentage, 100.00);
        v_fee := 0; -- No fixed fee for early cancellation unless specified in policy (future enhancement)
    END IF;

    v_refund_amount := (v_booking.total_price * v_refund_pct / 100.0) - v_fee;
    IF v_refund_amount < 0 THEN v_refund_amount := 0; END IF;

    v_result := jsonb_build_object(
        'success', true,
        'booking_id', p_booking_id,
        'total_price', v_booking.total_price,
        'hours_before_departure', v_hours_before,
        'refund_amount', v_refund_amount,
        'cancellation_fee', v_fee,
        'refund_percentage', v_refund_pct,
        'policy_name', v_policy.policy_name,
        'rule_id', v_rule.rule_id
    );

    -- 6. If p_confirm is true, perform atomic cancellation and refund record creation
    IF p_confirm THEN
        -- A. Update booking status
        UPDATE public.bookings 
        SET 
            booking_status = 'cancelled',
            cancel_reason = p_reason,
            cancel_timestamp = now(),
            refund_amount = v_refund_amount,
            payment_status = CASE WHEN payment_status = 'paid' THEN 'refunded'::payment_status ELSE payment_status END
        WHERE booking_id = p_booking_id;

        -- B. Create cancellation audit record
        INSERT INTO public.booking_cancellations (
            booking_id,
            cancelled_by_user_id,
            cancel_policy_id,
            rule_id,
            reason,
            hours_before_departure,
            original_total,
            refund_percentage,
            refund_amount,
            cancellation_fee,
            refund_status
        ) VALUES (
            p_booking_id,
            v_booking.user_id,
            v_policy_id,
            v_rule.rule_id,
            p_reason,
            v_hours_before,
            v_booking.total_price,
            v_refund_pct,
            v_refund_amount,
            v_fee,
            CASE WHEN v_booking.payment_status = 'paid' THEN 'pending' ELSE 'n/a' END
        );

        -- C. Create official refund record for the accountant
        IF v_booking.payment_status = 'paid' AND v_refund_amount > 0 THEN
            INSERT INTO public.refunds (
                booking_id,
                user_id,
                refund_amount,
                refund_method,
                status,
                created_at
            ) VALUES (
                p_booking_id,
                v_booking.user_id,
                v_refund_amount,
                v_booking.payment_method::text,
                'pending',
                now()
            );
        END IF;
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
