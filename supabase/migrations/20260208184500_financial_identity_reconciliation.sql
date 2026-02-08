-- ==========================================================
-- FINANCIAL SYSTEM IDENTITY RECONCILIATION
-- Date: 2026-02-08
-- Purpose: Standardize identity columns (user_id -> auth_id) in 
--          financial tables, views, and confirmation functions.
-- ==========================================================

BEGIN;

-- 0. Ensure all payment methods exist in the enum (Safety)
DO $$
BEGIN
    ALTER TYPE public.payment_method ADD VALUE IF NOT EXISTS 'cash';
    ALTER TYPE public.payment_method ADD VALUE IF NOT EXISTS 'bank_transfer';
    ALTER TYPE public.payment_method ADD VALUE IF NOT EXISTS 'wallet';
    ALTER TYPE public.payment_method ADD VALUE IF NOT EXISTS 'ahjazly_wallet';
    ALTER TYPE public.payment_method ADD VALUE IF NOT EXISTS 'stc_pay';
    ALTER TYPE public.payment_method ADD VALUE IF NOT EXISTS 'kareemi';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Standardize refunds Table
DO $$ 
BEGIN
    -- Rename processed_by/approved_by and change to UUID if they exist as BIGINT
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'refunds' AND column_name = 'processed_by' AND data_type = 'bigint') THEN
        ALTER TABLE public.refunds RENAME COLUMN processed_by TO old_processed_by;
        ALTER TABLE public.refunds ADD COLUMN processed_by UUID REFERENCES auth.users(id);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'refunds' AND column_name = 'approved_by' AND data_type = 'bigint') THEN
        ALTER TABLE public.refunds RENAME COLUMN approved_by TO old_approved_by;
        ALTER TABLE public.refunds ADD COLUMN approved_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 2. Standardize wallet_deposit_requests Table
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_deposit_requests' AND column_name = 'processed_by' AND data_type = 'bigint') THEN
        ALTER TABLE public.wallet_deposit_requests RENAME COLUMN processed_by TO old_processed_by;
        ALTER TABLE public.wallet_deposit_requests ADD COLUMN processed_by UUID REFERENCES auth.users(id);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_deposit_requests' AND column_name = 'created_by' AND data_type = 'bigint') THEN
        ALTER TABLE public.wallet_deposit_requests RENAME COLUMN created_by TO old_created_by;
        ALTER TABLE public.wallet_deposit_requests ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 3. REBUILD update_refund_status (FIXED: Uses auth_id)
CREATE OR REPLACE FUNCTION public.update_refund_status(
    p_refund_id BIGINT,
    p_new_status refund_status_enum,
    p_refund_reference VARCHAR DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_rejection_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_auth_id UUID := auth.uid();
    v_refund RECORD;
BEGIN
    -- Get refund details
    SELECT * INTO v_refund FROM public.refunds WHERE refund_id = p_refund_id;
    IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'message', 'Refund not found'); END IF;
    
    -- Update refund
    UPDATE public.refunds
    SET 
        status = p_new_status,
        refund_reference = COALESCE(p_refund_reference, refund_reference),
        notes = COALESCE(p_notes, notes),
        rejection_reason = CASE WHEN p_new_status = 'rejected' THEN p_rejection_reason ELSE rejection_reason END,
        processed_by = CASE WHEN p_new_status IN ('processing', 'completed', 'rejected', 'failed') THEN v_auth_id ELSE processed_by END,
        approved_by = CASE WHEN p_new_status = 'approved' THEN v_auth_id ELSE approved_by END,
        processed_at = CASE WHEN p_new_status = 'completed' THEN NOW() ELSE processed_at END
    WHERE refund_id = p_refund_id;
    
    -- Notify Customer
    INSERT INTO public.notifications (auth_id, title, message, type, priority)
    VALUES (
        v_refund.auth_id,
        'تحديث طلب الاسترداد',
        format('تم تحديث حالة استرداد الحجز #%s إلى %s', v_refund.booking_id, p_new_status),
        'payment', 'high'
    );
    
    RETURN jsonb_build_object('success', true, 'refund_id', p_refund_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. REBUILD approve_deposit_request (FIXED: Uses auth_id)
CREATE OR REPLACE FUNCTION public.approve_deposit_request(
    p_request_id BIGINT,
    p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_request RECORD;
    v_wallet_result JSONB;
BEGIN
    SELECT * INTO v_request FROM public.wallet_deposit_requests WHERE request_id = p_request_id FOR UPDATE;
    IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'message', 'Request not found'); END IF;
    IF v_request.status != 'pending' THEN RETURN jsonb_build_object('success', false, 'message', 'Already processed'); END IF;

    -- Process Wallet (uses auth_id internal bridge)
    SELECT public.process_wallet_transaction(
        (SELECT auth_id FROM public.wallets WHERE wallet_id = v_request.wallet_id),
        'deposit',
        v_request.amount,
        v_request.transaction_ref,
        format('شحن رصيد - مرجع: %s', v_request.transaction_ref)
    ) INTO v_wallet_result;

    IF NOT (v_wallet_result->>'success')::boolean THEN RETURN v_wallet_result; END IF;

    -- Update request
    UPDATE public.wallet_deposit_requests
    SET status = 'completed', admin_notes = p_admin_notes, processed_by = auth.uid(), processed_at = now()
    WHERE request_id = p_request_id;

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Restore Audit Logging in update_payment_v3
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
    SELECT * INTO v_booking FROM public.bookings WHERE booking_id = p_booking_id;
    IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'message', 'Booking not found'); END IF;

    -- Wallet Logic
    IF p_payment_method = 'wallet' AND p_payment_status = 'paid' AND v_booking.payment_status != 'paid' THEN
        SELECT public.process_wallet_transaction(v_booking.auth_id, 'payment', v_booking.total_price, p_booking_id::text, format('دفع حجز #%s', p_booking_id)) 
        INTO v_wallet_result;
        IF NOT (v_wallet_result->>'success')::boolean THEN RETURN v_wallet_result; END IF;
    END IF;

    -- Update Booking
    UPDATE public.bookings
    SET payment_status = p_payment_status, payment_method = p_payment_method, 
        gateway_transaction_id = COALESCE(p_transaction_id, gateway_transaction_id),
        payment_timestamp = CASE WHEN p_payment_status = 'paid' THEN NOW() ELSE payment_timestamp END
    WHERE booking_id = p_booking_id;

    -- Audit Log (Restore)
    INSERT INTO public.payment_transactions (booking_id, auth_id, amount, payment_method, gateway_ref, status)
    VALUES (p_booking_id, v_booking.auth_id, v_booking.total_price, p_payment_method::text, p_transaction_id, p_payment_status::text)
    ON CONFLICT DO NOTHING;

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. REBUILD VIEWS (FIXED: Identity Joins)
DROP VIEW IF EXISTS public.refunds_status_report CASCADE;
CREATE OR REPLACE VIEW public.refunds_status_report AS
SELECT 
    r.refund_id,
    r.booking_id,
    r.auth_id,
    u.full_name as customer_name,
    r.refund_amount,
    r.refund_method,
    r.status,
    r.refund_reference,
    r.created_at as requested_at,
    r.processed_at,
    EXTRACT(EPOCH FROM (COALESCE(r.processed_at, NOW()) - r.created_at))/3600 as processing_hours,
    processor.full_name as processed_by_name,
    approver.full_name as approved_by_name,
    r.rejection_reason,
    r.notes,
    b.payment_method as original_payment_method,
    t.partner_id
FROM public.refunds r
JOIN public.users u ON r.auth_id = u.auth_id
JOIN public.bookings b ON r.booking_id = b.booking_id
JOIN public.trips t ON b.trip_id = t.trip_id
LEFT JOIN public.users processor ON r.processed_by = processor.auth_id
LEFT JOIN public.users approver ON r.approved_by = approver.auth_id;

COMMIT;

