-- ========================================================
-- EXPAND PAYMENT METHODS TO MATCH APP OPTIONS
-- ========================================================

-- Add new payment methods to the enum
-- Note: PostgreSQL 13+ supports ADD VALUE IF NOT EXISTS
ALTER TYPE public.payment_method ADD VALUE IF NOT EXISTS 'kareemi';
ALTER TYPE public.payment_method ADD VALUE IF NOT EXISTS 'electronic';
ALTER TYPE public.payment_method ADD VALUE IF NOT EXISTS 'wallet';
ALTER TYPE public.payment_method ADD VALUE IF NOT EXISTS 'bank_transfer';

-- Update update_payment_v2 to ensure it handles these values safely
CREATE OR REPLACE FUNCTION public.update_payment_v2(
    p_booking_id BIGINT,
    p_payment_status public.payment_status,
    p_payment_method public.payment_method,
    p_transaction_id VARCHAR DEFAULT NULL
)
RETURNS JSONB AS $$
BEGIN
    UPDATE public.bookings
    SET 
        payment_status = p_payment_status,
        payment_method = p_payment_method,
        gateway_transaction_id = p_transaction_id,
        payment_timestamp = CASE WHEN p_payment_status = 'paid' THEN NOW() ELSE payment_timestamp END
    WHERE booking_id = p_booking_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Booking not found');
    END IF;

    -- Optional: Log to payment_transactions for audit
    INSERT INTO public.payment_transactions (
        booking_id,
        user_id,
        amount,
        payment_method,
        gateway_ref,
        status,
        created_at
    )
    SELECT 
        b.booking_id,
        b.user_id,
        b.total_price,
        p_payment_method::text,
        p_transaction_id,
        p_payment_status::text,
        NOW()
    FROM public.bookings b
    WHERE b.booking_id = p_booking_id;

    RETURN jsonb_build_object('success', true, 'message', 'Payment updated successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
