-- ==========================================================
-- ID REVOLUTION FUNCTIONS & TRIGGERS (Phase 1.1)
-- Date: 2026-01-31
-- Purpose: Updating logic to use UUID (auth_id) directly
-- ==========================================================

BEGIN;

-- 1. UPDATE CORE AUTH FUNCTIONS
-- ==========================================================

-- Unified get_current_role (uses UUID natively)
CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::TEXT FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1
$$;

-- Unified check_permission (uses UUID and professional roles)
CREATE OR REPLACE FUNCTION public.check_permission(p_permission_code TEXT)
RETURNS BOOLEAN
LANGUAGE PLPGSQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role TEXT;
    v_partner_id INTEGER;
BEGIN
    SELECT role::TEXT, partner_id INTO v_role, v_partner_id 
    FROM public.user_roles 
    WHERE user_id = auth.uid() 
    LIMIT 1;

    -- SUPERUSER has absolute power
    IF v_role = 'SUPERUSER' THEN
        RETURN TRUE;
    END IF;

    -- PARTNER_ADMIN is superuser for their own data
    -- (We can refine this in RLS, but here it grants functional access)
    IF v_role = 'PARTNER_ADMIN' THEN
        RETURN TRUE;
    END IF;

    -- Check specific permissions
    RETURN EXISTS (
        SELECT 1 
        FROM public.role_permissions 
        WHERE role = v_role 
          AND permission_code = p_permission_code
          AND (partner_id = v_partner_id OR partner_id IS NULL)
    );
END;
$$;

-- 2. UPDATE TRiggers (handle_new_user)
-- ==========================================================

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
    v_is_super BOOLEAN;
    v_role public.app_role;
    v_user_type public.user_type;
BEGIN
    -- Determine role based on email domain
    v_is_super := (new.email LIKE '%@admin.com') OR (new.email LIKE '%@ahjazly.com');
    
    IF v_is_super THEN
        v_role := 'SUPERUSER'::public.app_role;
        v_user_type := 'SUPERUSER'::public.user_type;
    ELSE
        v_role := 'TRAVELER'::public.app_role; -- Using professional traveler role
        v_user_type := 'TRAVELER'::public.user_type;
    END IF;

    -- Insert into public.users
    INSERT INTO public.users (
        auth_id, 
        full_name, 
        email, 
        user_type, 
        account_status
    )
    VALUES (
        new.id, 
        COALESCE(new.raw_user_meta_data->>'full_name', 'New User'), 
        new.email, 
        v_user_type, 
        'active'
    )
    ON CONFLICT (auth_id) DO UPDATE
    SET 
        email = new.email,
        user_type = v_user_type; -- Force update type on conflict for safety

    -- Assign Role in user_roles (UUID user_id)
    INSERT INTO public.user_roles (user_id, role, partner_id)
    VALUES (new.id, v_role, NULL)
    ON CONFLICT (user_id, role) DO NOTHING;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. UPDATE WALLET LOGIC (UUID NATIVE)
-- ==========================================================

-- Update wallet trigger to use UUID
CREATE OR REPLACE FUNCTION public.handle_new_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
    -- Using auth_id (UUID) as the primary link
    INSERT INTO public.wallets (auth_id, user_id)
    VALUES (NEW.auth_id, NEW.user_id)
    ON CONFLICT (auth_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update process_wallet_transaction to accept UUID
CREATE OR REPLACE FUNCTION public.process_wallet_transaction_uuid(
    p_auth_id UUID,
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
BEGIN
    -- Directly lock wallet using UUID
    SELECT wallet_id, balance INTO v_wallet_id, v_old_balance 
    FROM public.wallets 
    WHERE auth_id = p_auth_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Wallet not found');
    END IF;

    -- Calculation logic
    IF p_type IN ('payment', 'withdrawal') THEN
        v_new_balance := v_old_balance - p_amount;
        IF v_new_balance < 0 THEN
            RETURN jsonb_build_object('success', false, 'message', 'Insufficient balance');
        END IF;
    ELSE
        v_new_balance := v_old_balance + p_amount;
    END IF;

    UPDATE public.wallets 
    SET balance = v_new_balance, updated_at = now() 
    WHERE wallet_id = v_wallet_id;

    INSERT INTO public.wallet_transactions (
        wallet_id, type, amount, previous_balance, new_balance, reference_id, description, created_by_auth_id
    ) VALUES (
        v_wallet_id, p_type, p_amount, v_old_balance, v_new_balance, p_reference_id, p_description, auth.uid()
    );

    RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RE-ENABLE RLS WITH UUID (THE PERFORMANCE BOOST)
-- ==========================================================

-- Wallets
DROP POLICY IF EXISTS "Users can view own wallet" ON public.wallets;
CREATE POLICY "Users can view own wallet" ON public.wallets
    FOR SELECT USING (auth_id = auth.uid());

-- Bookings
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
CREATE POLICY "Users can view their own bookings" ON public.bookings
    FOR SELECT USING (auth_id = auth.uid());

-- Ratings
DROP POLICY IF EXISTS "Users can view their own ratings" ON public.ratings;
CREATE POLICY "Users can view their own ratings" ON public.ratings
    FOR SELECT USING (auth_id = auth.uid());

COMMIT;
