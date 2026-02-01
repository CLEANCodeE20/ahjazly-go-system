-- ========================================================
-- WALLET SYSTEM IMPLEMENTATION
-- Date: 2026-01-23
-- Purpose: Centralized digital wallet for refunds and payments
-- ========================================================

BEGIN;

-- 1. Create Wallet Table
CREATE TABLE IF NOT EXISTS public.wallets (
    wallet_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(user_id) ON DELETE CASCADE UNIQUE,
    balance NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    currency VARCHAR(10) DEFAULT 'YER' NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Wallet Transaction Types Enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wallet_transaction_type') THEN
        CREATE TYPE wallet_transaction_type AS ENUM (
            'deposit',      -- شحن رصيد أو استرداد
            'payment',      -- دفع قيمة تذكرة
            'withdrawal',   -- سحب كاش
            'bonus',        -- مكافأة أو تعويض
            'adjustment'    -- تسوية يدوية
        );
    END IF;
END $$;

-- 3. Create Wallet Transactions Table
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    transaction_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    wallet_id BIGINT REFERENCES public.wallets(wallet_id) ON DELETE CASCADE,
    type wallet_transaction_type NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    previous_balance NUMERIC(12, 2) NOT NULL,
    new_balance NUMERIC(12, 2) NOT NULL,
    reference_id VARCHAR(100), -- e.g., booking_id or withdrawal_id
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by BIGINT REFERENCES public.users(user_id)
);


-- 4. Create Withdrawal Requests Table
CREATE TABLE IF NOT EXISTS public.wallet_withdrawal_requests (
    request_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    wallet_id BIGINT REFERENCES public.wallets(wallet_id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    bank_name VARCHAR(100),
    account_name VARCHAR(255),
    account_number VARCHAR(100),
    status refund_status_enum DEFAULT 'pending'::refund_status_enum,
    processed_by BIGINT REFERENCES public.users(user_id),
    processed_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Trigger: Auto-create wallet for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.wallets (user_id)
    VALUES (NEW.user_id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_create_wallet_on_user_signup ON public.users;
CREATE TRIGGER tr_create_wallet_on_user_signup
    AFTER INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_wallet();

-- 6. Function: Process Wallet Transaction (Atomic)
CREATE OR REPLACE FUNCTION public.process_wallet_transaction(
    p_user_id BIGINT,
    p_type wallet_transaction_type,
    p_amount NUMERIC,
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

    -- Get wallet and lock for update
    SELECT wallet_id, balance INTO v_wallet_id, v_old_balance 
    FROM public.wallets 
    WHERE user_id = p_user_id 
    FOR UPDATE;

    IF NOT FOUND THEN
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
    UPDATE public.wallets 
    SET balance = v_new_balance, updated_at = now() 
    WHERE wallet_id = v_wallet_id;

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

-- 7. Helper Functions for RLS
CREATE OR REPLACE FUNCTION public.auth_id_matches(p_user_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users 
        WHERE user_id = p_user_id AND auth_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_current_partner_id()
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT partner_id FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. RLS Policies
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Users can see their own wallet
CREATE POLICY "Users can view own wallet" ON public.wallets
    FOR SELECT USING (auth_id_matches(user_id));

-- Users can see their own transactions
CREATE POLICY "Users can view own transactions" ON public.wallet_transactions
    FOR SELECT USING (
        wallet_id IN (SELECT wallet_id FROM public.wallets WHERE auth_id_matches(user_id))
    );

-- Admins can see everything
CREATE POLICY "Admins can view all wallets" ON public.wallets
    FOR ALL USING (is_admin());

CREATE POLICY "Admins can view all transactions" ON public.wallet_transactions
    FOR ALL USING (is_admin());

COMMIT;
