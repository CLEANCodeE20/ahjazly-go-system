-- ========================================================
-- WALLET DEPOSIT REQUESTS SYSTEM
-- Date: 2026-01-25
-- Purpose: Allow users/partners to notify admin about bank transfers for wallet charging
-- ========================================================

BEGIN;

-- 1. Create Deposit Requests Table
CREATE TABLE IF NOT EXISTS public.wallet_deposit_requests (
    request_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    wallet_id BIGINT REFERENCES public.wallets(wallet_id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- e.g., 'Bank Transfer', 'Al-Kuraimi', etc.
    transaction_ref VARCHAR(100), -- Reference number from the bank
    proof_image_url TEXT, -- URL to the receipt image
    status refund_status_enum DEFAULT 'pending'::refund_status_enum,
    notes TEXT,
    admin_notes TEXT,
    processed_by BIGINT REFERENCES public.users(user_id),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by BIGINT REFERENCES public.users(user_id)
);

-- 2. RLS Policies for Deposit Requests
ALTER TABLE public.wallet_deposit_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users/Partners can view own deposit requests" ON public.wallet_deposit_requests
    FOR SELECT USING (
        wallet_id IN (
            SELECT wallet_id FROM public.wallets 
            WHERE (user_id IS NOT NULL AND auth_id_matches(user_id)) 
            OR (partner_id IS NOT NULL AND partner_id = get_current_partner_id())
        )
    );

CREATE POLICY "Users/Partners can create deposit requests" ON public.wallet_deposit_requests
    FOR INSERT WITH CHECK (
        wallet_id IN (
            SELECT wallet_id FROM public.wallets 
            WHERE (user_id IS NOT NULL AND auth_id_matches(user_id)) 
            OR (partner_id IS NOT NULL AND partner_id = get_current_partner_id())
        )
    );

CREATE POLICY "Admins can manage all deposit requests" ON public.wallet_deposit_requests
    FOR ALL USING (is_admin());

-- 3. Function to Approve Deposit Request
CREATE OR REPLACE FUNCTION public.approve_deposit_request(
    p_request_id BIGINT,
    p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_request RECORD;
    v_wallet_result JSONB;
BEGIN
    -- 1. Get request details
    SELECT * INTO v_request FROM public.wallet_deposit_requests WHERE request_id = p_request_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Request not found');
    END IF;
    
    IF v_request.status != 'pending' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Request is already processed');
    END IF;

    -- 2. Process the wallet transaction
    SELECT public.process_wallet_transaction(
        NULL, -- user_id (not needed if we have wallet_id, but our function needs one. Let's update it or use a trick)
        (SELECT partner_id FROM public.wallets WHERE wallet_id = v_request.wallet_id),
        'deposit',
        v_request.amount,
        v_request.transaction_ref,
        format('شحن رصيد عبر %s - مرجع: %s', v_request.payment_method, v_request.transaction_ref)
    ) INTO v_wallet_result;

    -- If the above failed because it's a customer wallet (no partner_id), try with user_id
    IF NOT (v_wallet_result->>'success')::boolean THEN
         SELECT public.process_wallet_transaction(
            (SELECT user_id FROM public.wallets WHERE wallet_id = v_request.wallet_id),
            NULL,
            'deposit',
            v_request.amount,
            v_request.transaction_ref,
            format('شحن رصيد عبر %s - مرجع: %s', v_request.payment_method, v_request.transaction_ref)
        ) INTO v_wallet_result;
    END IF;

    IF NOT (v_wallet_result->>'success')::boolean THEN
        RETURN v_wallet_result;
    END IF;

    -- 3. Update request status
    UPDATE public.wallet_deposit_requests
    SET 
        status = 'completed',
        admin_notes = p_admin_notes,
        processed_by = (SELECT user_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1),
        processed_at = now()
    WHERE request_id = p_request_id;

    RETURN jsonb_build_object('success', true, 'message', 'Deposit approved and wallet updated');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
