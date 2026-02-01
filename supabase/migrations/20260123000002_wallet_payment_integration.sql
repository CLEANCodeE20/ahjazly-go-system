-- ========================================================
-- UPDATE PAYMENT RPCS FOR WALLET SUPPORT
-- Date: 2026-01-23
-- Purpose: Deduct from wallet when payment_method is 'wallet'
-- ========================================================

BEGIN;

-- 1. Enhanced update_payment_v3
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
    -- Get booking details
    SELECT * INTO v_booking FROM public.bookings WHERE booking_id = p_booking_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Booking not found');
    END IF;

    -- If payment is already paid, don't re-process wallet
    IF v_booking.payment_status = 'paid' AND p_payment_status = 'paid' THEN
        RETURN jsonb_build_object('success', true, 'message', 'Payment already confirmed');
    END IF;

    -- Handle Wallet Payment
    IF p_payment_method = 'wallet' AND p_payment_status = 'paid' THEN
        -- Deduct from wallet
        SELECT public.process_wallet_transaction(
            v_booking.user_id,
            'payment',
            v_booking.total_price,
            p_booking_id::text,
            format('دفع قيمة الحجز رقم #%s', p_booking_id)
        ) INTO v_wallet_result;

        IF NOT (v_wallet_result->>'success')::boolean THEN
            RETURN v_wallet_result; -- Return error (e.g., insufficient balance)
        END IF;
    END IF;

    -- Update Booking
    UPDATE public.bookings
    SET 
        payment_status = p_payment_status,
        payment_method = p_payment_method,
        gateway_transaction_id = COALESCE(p_transaction_id, gateway_transaction_id),
        payment_timestamp = CASE WHEN p_payment_status = 'paid' THEN NOW() ELSE payment_timestamp END
    WHERE booking_id = p_booking_id;

    -- Log to payment_transactions
    INSERT INTO public.payment_transactions (
        booking_id, user_id, amount, payment_method, gateway_ref, status, created_at
    ) VALUES (
        p_booking_id, v_booking.user_id, v_booking.total_price, p_payment_method::text, p_transaction_id, p_payment_status::text, NOW()
    );

    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Payment updated successfully',
        'wallet_processed', (p_payment_method = 'wallet')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
