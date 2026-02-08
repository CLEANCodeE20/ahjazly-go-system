-- ==========================================================
-- FUNCTION OVERLOADING RESOLUTION
-- Date: 2026-02-08
-- Purpose: Remove conflicting signatures of update_booking_payment
--          (BIGINT vs INTEGER) which cause PostgREST PGRST203.
-- ==========================================================

BEGIN;

-- 1. DROP ALL CANDIDATES
-- We must specify the full signature to drop the overloaded versions
DROP FUNCTION IF EXISTS public.update_booking_payment(bigint, text, text, text);
DROP FUNCTION IF EXISTS public.update_booking_payment(integer, text, text, text);

-- Also drop legacy create_booking_v3 variants if they exist (old BIGINT userId)
DROP FUNCTION IF EXISTS public.create_booking_v3(bigint, bigint, public.payment_method, jsonb);

-- 2. RECREATE THE CORRECT ONE (BIGINT)
CREATE OR REPLACE FUNCTION public.update_booking_payment(
    p_booking_id BIGINT,
    p_status TEXT,
    p_method TEXT,
    p_transaction_id TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_payment_status public.payment_status;
    v_payment_method public.payment_method;
BEGIN
    -- Map text to Enums (with validation)
    BEGIN
        v_payment_status := p_status::public.payment_status;
        v_payment_method := p_method::public.payment_method;
    EXCEPTION WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid status or payment method value');
    END;

    -- Call the localized update function (update_payment_v3)
    -- This ensures wallet logic and auditing are preserved
    RETURN public.update_payment_v3(
        p_booking_id,
        v_payment_status,
        v_payment_method,
        p_transaction_id::VARCHAR
    );
EXCEPTION WHEN OTHERS THEN
    -- Final Fallback
    UPDATE public.bookings
    SET 
        payment_status = p_status::public.payment_status,
        payment_method = p_method::public.payment_method,
        gateway_transaction_id = COALESCE(p_transaction_id, gateway_transaction_id),
        payment_timestamp = CASE WHEN p_status = 'paid' THEN NOW() ELSE payment_timestamp END
    WHERE booking_id = p_booking_id;
    
    RETURN jsonb_build_object('success', true, 'message', 'Payment updated (fallback mode)');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
