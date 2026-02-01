-- ========================================================
-- INTEGRATE WALLET WITH CANCELLATION LOGIC
-- Date: 2026-01-23
-- Purpose: Automatically refund to wallet on cancellation
-- ========================================================

BEGIN;

-- 1. Update cancel_booking_rpc to handle wallet refunds
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
    v_wallet_result JSONB;
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
    v_current_time_local := now() AT TIME ZONE 'Asia/Aden';
    v_hours_before := FLOOR(extract(epoch from (v_trip.departure_time - v_current_time_local)) / 3600);

    -- 3. Determine policy
    v_policy_id := v_booking.cancel_policy_id;
    IF v_policy_id IS NULL THEN
        SELECT cancel_policy_id INTO v_policy_id 
        FROM public.cancel_policies 
        WHERE partner_id = v_trip.partner_id AND is_default = true AND is_active = true
        LIMIT 1;
    END IF;

    -- 4. Find matching rule
    SELECT * INTO v_rule 
    FROM public.cancel_policy_rules 
    WHERE cancel_policy_id = v_policy_id 
      AND (min_hours_before_departure IS NULL OR v_hours_before >= min_hours_before_departure)
      AND is_active = true
    ORDER BY min_hours_before_departure DESC
    LIMIT 1;

    -- Financial calculation
    IF NOT FOUND THEN
        v_refund_amount := 0;
        v_fee := v_booking.total_price;
    ELSE
        v_refund_amount := (v_booking.total_price * COALESCE(v_rule.refund_percentage, 0) / 100.0) - COALESCE(v_rule.cancellation_fee, 0);
        v_fee := COALESCE(v_rule.cancellation_fee, 0) + (v_booking.total_price * (100 - COALESCE(v_rule.refund_percentage, 0)) / 100.0);
    END IF;

    IF v_refund_amount < 0 THEN v_refund_amount := 0; END IF;

    v_result := jsonb_build_object(
        'success', true,
        'booking_id', p_booking_id,
        'refund_amount', v_refund_amount,
        'cancellation_fee', v_fee
    );

    -- 5. Atomic Execution
    IF p_confirm THEN
        -- Update booking status
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
        UPDATE public.passengers SET passenger_status = 'cancelled' WHERE booking_id = p_booking_id;

        -- PROCESS WALLET REFUND (New Logic)
        IF v_booking.payment_status = 'paid' AND v_refund_amount > 0 THEN
            -- Automatically deposit to user's wallet
            SELECT public.process_wallet_transaction(
                v_booking.user_id, 
                'deposit', 
                v_refund_amount, 
                p_booking_id::text, 
                format('استرداد تلقائي للحجز رقم #%s', p_booking_id)
            ) INTO v_wallet_result;
            
            v_result := v_result || jsonb_build_object('wallet_refund', v_wallet_result);
        END IF;
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
