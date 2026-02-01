-- ========================================================
-- CORPORATE WALLET SYSTEM UPGRADE
-- Date: 2026-01-25
-- Purpose: Transition from individual wallets to partner-based corporate wallets
-- ========================================================

BEGIN;

-- 1. Add partner_id to wallets table
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS partner_id BIGINT REFERENCES public.partners(partner_id) ON DELETE CASCADE;

-- 2. Create a unique constraint: A partner can only have ONE wallet
-- Note: We keep user_id as optional for individual customer wallets
ALTER TABLE public.wallets DROP CONSTRAINT IF EXISTS wallets_partner_id_key;
ALTER TABLE public.wallets ADD CONSTRAINT wallets_partner_id_key UNIQUE (partner_id);

-- 3. Update handle_new_user_wallet to NOT create wallets for employees
-- Instead, employees will use their partner's wallet
CREATE OR REPLACE FUNCTION public.handle_new_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create individual wallets for 'customer' type users
    IF NEW.user_type = 'customer' THEN
        INSERT INTO public.wallets (user_id)
        VALUES (NEW.user_id)
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function to get the effective wallet_id for a user
-- If employee -> returns partner's wallet
-- If customer -> returns personal wallet
CREATE OR REPLACE FUNCTION public.get_effective_wallet_id(p_user_id BIGINT)
RETURNS BIGINT AS $$
DECLARE
    v_user_type VARCHAR;
    v_partner_id BIGINT;
    v_wallet_id BIGINT;
BEGIN
    SELECT user_type, partner_id INTO v_user_type, v_partner_id FROM public.users WHERE user_id = p_user_id;

    IF v_user_type = 'employee' AND v_partner_id IS NOT NULL THEN
        SELECT wallet_id INTO v_wallet_id FROM public.wallets WHERE partner_id = v_partner_id;
    ELSE
        SELECT wallet_id INTO v_wallet_id FROM public.wallets WHERE user_id = p_user_id;
    END IF;

    RETURN v_wallet_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 5. Update process_wallet_transaction to support both user_id and partner_id
CREATE OR REPLACE FUNCTION public.process_wallet_transaction(
    p_user_id BIGINT DEFAULT NULL,
    p_partner_id BIGINT DEFAULT NULL,
    p_type wallet_transaction_type DEFAULT 'adjustment',
    p_amount NUMERIC DEFAULT 0,
    p_reference_id VARCHAR DEFAULT NULL,
    p_description TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_wallet_id BIGINT;
    v_old_balance NUMERIC;
    v_new_balance NUMERIC;
    v_current_user_id BIGINT;
BEGIN
    -- Get current user for audit
    SELECT user_id INTO v_current_user_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1;

    -- Determine which wallet to use
    IF p_partner_id IS NOT NULL THEN
        SELECT wallet_id, balance INTO v_wallet_id, v_old_balance FROM public.wallets WHERE partner_id = p_partner_id FOR UPDATE;
    ELSIF p_user_id IS NOT NULL THEN
        -- Check if this user is an employee, if so use partner wallet
        v_wallet_id := public.get_effective_wallet_id(p_user_id);
        SELECT balance INTO v_old_balance FROM public.wallets WHERE wallet_id = v_wallet_id FOR UPDATE;
    ELSE
        RETURN jsonb_build_object('success', false, 'message', 'Either user_id or partner_id must be provided');
    END IF;

    IF v_wallet_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Wallet not found');
    END IF;

    -- Calculate new balance
    IF p_type IN ('payment', 'withdrawal') THEN
        v_new_balance := v_old_balance - p_amount;
        IF v_new_balance < 0 THEN
            RETURN jsonb_build_object('success', false, 'message', 'Insufficient balance');
        END IF;
    ELSE
        v_new_balance := v_old_balance + p_amount;
    END IF;

    -- Update wallet
    UPDATE public.wallets SET balance = v_new_balance, updated_at = now() WHERE wallet_id = v_wallet_id;

    -- Log transaction
    INSERT INTO public.wallet_transactions (
        wallet_id, type, amount, previous_balance, new_balance, reference_id, description, created_by
    ) VALUES (
        v_wallet_id, p_type, p_amount, v_old_balance, v_new_balance, p_reference_id, p_description, v_current_user_id
    );

    RETURN jsonb_build_object(
        'success', true, 
        'new_balance', v_new_balance, 
        'transaction_id', currval('public.wallet_transactions_transaction_id_seq')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Update RLS Policies for Wallets
DROP POLICY IF EXISTS "Users can view own wallet" ON public.wallets;
CREATE POLICY "Users/Partners can view their wallet" ON public.wallets
    FOR SELECT USING (
        (user_id IS NOT NULL AND auth_id_matches(user_id)) OR
        (partner_id IS NOT NULL AND partner_id = get_current_partner_id())
    );

DROP POLICY IF EXISTS "Users can view own transactions" ON public.wallet_transactions;
CREATE POLICY "Users/Partners can view their transactions" ON public.wallet_transactions
    FOR SELECT USING (
        wallet_id IN (
            SELECT wallet_id FROM public.wallets 
            WHERE (user_id IS NOT NULL AND auth_id_matches(user_id)) 
            OR (partner_id IS NOT NULL AND partner_id = get_current_partner_id())
        )
    );

-- 7. View for Partner Wallet Analytics
CREATE OR REPLACE VIEW public.partner_wallet_summary AS
SELECT 
    p.partner_id,
    p.company_name,
    w.balance as wallet_balance,
    w.currency,
    (SELECT COUNT(*) FROM public.wallet_transactions wt WHERE wt.wallet_id = w.wallet_id) as total_transactions,
    (SELECT SUM(amount) FROM public.wallet_transactions wt WHERE wt.wallet_id = w.wallet_id AND type = 'deposit') as total_deposits,
    (SELECT SUM(ABS(amount)) FROM public.wallet_transactions wt WHERE wt.wallet_id = w.wallet_id AND type = 'payment') as total_spent
FROM public.partners p
JOIN public.wallets w ON w.partner_id = p.partner_id;

GRANT SELECT ON public.partner_wallet_summary TO authenticated;

COMMIT;
