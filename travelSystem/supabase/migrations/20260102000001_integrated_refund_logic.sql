-- ========================================================
-- INTEGRATED REFUND AND FINANCIAL LOGIC (HYBRID MODEL)
-- Purpose: 
-- 1. Fix seat release by updating passenger status on cancellation.
-- 2. Differentiate commission collection (Online vs Cash).
-- 3. Consolidate financial triggers to ensure audit consistency.
-- ========================================================

-- 1. Infrastructure Update
ALTER TABLE public.commissions 
ADD COLUMN IF NOT EXISTS collection_status VARCHAR(20) DEFAULT 'pending';

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS cancellation_fee NUMERIC(10,2);

COMMENT ON COLUMN public.commissions.collection_status IS 
'collected: Platform holds the money | pending: Partner holds the money | settled: Reconciliation complete';

-- 2. Fixed Cancellation RPC
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
    
    -- 2. Calculate hours before departure (Robust Timezone Handling)
    -- We use FLOOR to get the number of FULL hours remaining.
    v_current_time_local := now() AT TIME ZONE 'Asia/Aden';
    v_hours_before := FLOOR(extract(epoch from (v_trip.departure_time - v_current_time_local)) / 3600);

    -- 3. Determine policy (with robust fallback)
    v_policy_id := v_booking.cancel_policy_id;
    
    IF v_policy_id IS NULL THEN
        -- Try default policy
        SELECT cancel_policy_id INTO v_policy_id 
        FROM public.cancel_policies 
        WHERE partner_id = v_trip.partner_id AND is_default = true 
        AND is_active = true
        LIMIT 1;
        
        -- If still no default, try ANY active policy for this partner
        IF v_policy_id IS NULL THEN
            SELECT cancel_policy_id INTO v_policy_id 
            FROM public.cancel_policies 
            WHERE partner_id = v_trip.partner_id AND is_active = true
            ORDER BY priority DESC, created_at DESC
            LIMIT 1;
        END IF;
    END IF;

    -- 4. Find matching rule based on "at least X hours" (Greedy Matching)
    SELECT * INTO v_rule 
    FROM public.cancel_policy_rules 
    WHERE cancel_policy_id = v_policy_id 
      AND (min_hours_before_departure IS NULL OR v_hours_before >= min_hours_before_departure)
      AND is_active = true
    ORDER BY min_hours_before_departure DESC
    LIMIT 1;

    -- Financial calculation
    IF NOT FOUND THEN
        -- Default: No refund if no rule matches
        v_refund_amount := 0;
        v_fee := v_booking.total_price;
    ELSE
        -- Ensure we have a valid refund percentage
        DECLARE
            v_perc NUMERIC := COALESCE(v_rule.refund_percentage, 0);
            v_const_fee NUMERIC := COALESCE(v_rule.cancellation_fee, 0);
        BEGIN
            v_refund_amount := (v_booking.total_price * v_perc / 100.0) - v_const_fee;
            v_fee := v_const_fee + (v_booking.total_price * (100 - v_perc) / 100.0);
        END;
    END IF;

    IF v_refund_amount < 0 THEN v_refund_amount := 0; END IF;

    v_result := jsonb_build_object(
        'success', true,
        'booking_id', p_booking_id,
        'total_price', v_booking.total_price,
        'hours_before_departure', v_hours_before,
        'refund_amount', v_refund_amount,
        'cancellation_fee', v_fee,
        'refund_percentage', COALESCE(v_rule.refund_percentage, 0),
        'debug_policy_id', v_policy_id,
        'debug_rule_id', v_rule.rule_id,
        'debug_current_time', v_current_time_local,
        'debug_departure_time', v_trip.departure_time
    );

    -- 5. Atomic Execution
    IF p_confirm THEN
        DECLARE
            v_canceller_id BIGINT;
        BEGIN
            -- Identify the person performing the cancellation (User or Employee)
            SELECT user_id INTO v_canceller_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1;
            v_canceller_id := COALESCE(v_canceller_id, v_booking.user_id);

            UPDATE public.bookings 
            SET 
                booking_status = 'cancelled',
                cancel_reason = p_reason,
                cancel_timestamp = now(),
                refund_amount = v_refund_amount,
                cancellation_fee = v_fee,
                payment_status = CASE WHEN payment_status = 'paid' THEN 'refunded'::payment_status ELSE payment_status END
            WHERE booking_id = p_booking_id;

            -- Release seats by cancelling passengers
            UPDATE public.passengers 
            SET passenger_status = 'cancelled'
            WHERE booking_id = p_booking_id;

            -- Audit record
            INSERT INTO public.booking_cancellations (
                booking_id, cancelled_by_user_id, cancel_policy_id, rule_id, reason,
                hours_before_departure, original_total, refund_percentage,
                refund_amount, cancellation_fee, refund_status
            ) VALUES (
                p_booking_id, v_canceller_id, v_policy_id, v_rule.rule_id, p_reason,
                v_hours_before, v_booking.total_price, COALESCE(v_rule.refund_percentage, 0),
                v_refund_amount, v_fee,
                CASE WHEN v_booking.payment_status = 'paid' THEN 'pending' ELSE 'n/a' END
            );

            -- Refund record for accountants
            IF v_booking.payment_status = 'paid' AND v_refund_amount > 0 THEN
                INSERT INTO public.refunds (
                    booking_id, user_id, refund_amount, refund_method, status
                ) VALUES (
                    p_booking_id, v_booking.user_id, v_refund_amount, v_booking.payment_method::text, 'pending'
                );
            END IF;
        END;
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Unified Hybrid Financial Engine
CREATE OR REPLACE FUNCTION public.handle_booking_financials()
RETURNS TRIGGER AS $$
DECLARE
    v_partner_id BIGINT;
    v_commission_pct NUMERIC;
    v_commission_amt NUMERIC;
    v_partner_rev NUMERIC;
    v_is_online_payment BOOLEAN;
    v_collection_status VARCHAR(20);
    v_cancellation_fee NUMERIC;
    v_old_commission NUMERIC;
    v_commission_refund NUMERIC;
BEGIN
    -- Get partner and commission info
    SELECT t.partner_id, p.commission_percentage 
    INTO v_partner_id, v_commission_pct
    FROM public.trips t
    JOIN public.partners p ON p.partner_id = t.partner_id
    WHERE t.trip_id = NEW.trip_id;

    -- Determine if online payment (Platform collects)
    v_is_online_payment := NEW.payment_method IN ('card', 'wallet', 'stc_pay');
    v_collection_status := CASE WHEN v_is_online_payment THEN 'collected' ELSE 'pending' END;

    -- CASE A: Booking confirmed and paid (Normal Flow)
    IF (NEW.booking_status = 'confirmed' AND NEW.payment_status = 'paid') 
       AND (OLD.booking_status != 'confirmed' OR OLD.payment_status != 'paid') THEN
        
        -- Calculate amounts
        v_commission_amt := (NEW.total_price * COALESCE(v_commission_pct, 10.00) / 100.0);
        v_partner_rev := NEW.total_price - v_commission_amt;

        -- Update booking fields
        NEW.platform_commission := v_commission_amt;
        NEW.partner_revenue := v_partner_rev;

        -- 1. Record Commission
        INSERT INTO public.commissions (
            booking_id, partner_id, trip_id, booking_amount, 
            commission_percentage, commission_amount, partner_revenue, 
            status, collection_status, notes
        ) VALUES (
            NEW.booking_id, v_partner_id, NEW.trip_id, NEW.total_price, 
            v_commission_pct, v_commission_amt, v_partner_rev, 
            'calculated', v_collection_status,
            CASE WHEN v_is_online_payment THEN 'Online payment - Collected by Platform' ELSE 'Cash/Partner payment - Pending debt' END
        );

        -- 2. Differentiated Ledger Entries
        IF v_is_online_payment THEN
            -- Platform holds total, owes partner net
            INSERT INTO public.booking_ledger (booking_id, partner_id, entry_type, amount, note)
            VALUES (NEW.booking_id, v_partner_id, 'booking', NEW.total_price, 'Platform received total payment (Online)');
            
            INSERT INTO public.booking_ledger (booking_id, partner_id, entry_type, amount, note)
            VALUES (NEW.booking_id, v_partner_id, 'commission', -v_commission_amt, 'Platform commission deduction');
            
            INSERT INTO public.booking_ledger (booking_id, partner_id, entry_type, amount, note)
            VALUES (NEW.booking_id, v_partner_id, 'adjustment', -v_partner_rev, 'Liability: platform owes partner net revenue');
        ELSE
            -- Partner holds total, owes platform commission
            INSERT INTO public.booking_ledger (booking_id, partner_id, entry_type, amount, note)
            VALUES (NEW.booking_id, v_partner_id, 'booking', NEW.total_price, 'Partner received total payment (Cash/Direct)');
            
            INSERT INTO public.booking_ledger (booking_id, partner_id, entry_type, amount, note)
            VALUES (NEW.booking_id, v_partner_id, 'commission', v_commission_amt, 'Debt: Partner owes platform commission');
        END IF;

    END IF;

    -- CASE B: Booking cancelled and refunded (Adjustment Flow)
    IF (NEW.booking_status = 'cancelled' AND NEW.payment_status = 'refunded')
       AND (OLD.payment_status != 'refunded') THEN
        
        v_cancellation_fee := NEW.total_price - NEW.refund_amount;
        v_old_commission := COALESCE(NEW.platform_commission, 0);

        -- Adjust commission based on the fee retained
        IF v_cancellation_fee > 0 THEN
            v_commission_amt := (v_cancellation_fee * COALESCE(v_commission_pct, 10.00) / 100.0);
        ELSE
            v_commission_amt := 0;
        END IF;

        v_commission_refund := v_old_commission - v_commission_amt;

        -- Update net results
        NEW.platform_commission := v_commission_amt;
        NEW.partner_revenue := v_cancellation_fee - v_commission_amt;

        -- 1. Record Adjustment in Ledger
        IF v_is_online_payment THEN
            -- Reverse liability and record actual refund
            INSERT INTO public.booking_ledger (booking_id, partner_id, entry_type, amount, note)
            VALUES (NEW.booking_id, v_partner_id, 'refund', -NEW.refund_amount, 'Platform reversed online payment to customer');
            
            IF v_commission_refund != 0 THEN
                INSERT INTO public.booking_ledger (booking_id, partner_id, entry_type, amount, note)
                VALUES (NEW.booking_id, v_partner_id, 'adjustment', v_commission_refund, 'Adjusted platform debt to partner');
            END IF;
        ELSE
            -- Reverse debt and record partner's action
            INSERT INTO public.booking_ledger (booking_id, partner_id, entry_type, amount, note)
            VALUES (NEW.booking_id, v_partner_id, 'refund', -NEW.refund_amount, 'Partner returned cash to customer');
            
            IF v_commission_refund != 0 THEN
                INSERT INTO public.booking_ledger (booking_id, partner_id, entry_type, amount, note)
                VALUES (NEW.booking_id, v_partner_id, 'adjustment', -v_commission_refund, 'Reduced partner debt to platform');
            END IF;
        END IF;

        -- 2. Update status
        UPDATE public.commissions 
        SET status = 'cancelled', 
            notes = 'Booking cancelled. Net platform cut: ' || v_commission_amt 
        WHERE booking_id = NEW.booking_id;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Automated Refund Notifications
CREATE OR REPLACE FUNCTION public.notify_refund_request()
RETURNS TRIGGER AS $$
DECLARE
    v_partner_id BIGINT;
    v_admin_id BIGINT;
    v_user_name TEXT;
BEGIN
    -- Get partner_id linked to the booking
    SELECT t.partner_id INTO v_partner_id
    FROM public.bookings b
    JOIN public.trips t ON b.trip_id = t.trip_id
    WHERE b.booking_id = NEW.booking_id;

    -- Get user name
    SELECT full_name INTO v_user_name FROM public.users WHERE user_id = NEW.user_id;

    -- Notify Partner Admin
    FOR v_admin_id IN (
        SELECT ur.user_id 
        FROM public.user_roles ur 
        WHERE ur.partner_id = v_partner_id AND ur.role IN ('admin', 'employee')
    ) LOOP
        INSERT INTO public.notifications (user_id, title, message, type, priority)
        VALUES (
            v_admin_id,
            'طلب استرداد جديد',
            format('هناك طلب استرداد بمبلغ %s للحجز رقم #%s (المسافر: %s).', NEW.refund_amount, NEW.booking_id, v_user_name),
            'booking',
            'high'
        );
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notify_refund_request ON public.refunds;
CREATE TRIGGER tr_notify_refund_request
    AFTER INSERT ON public.refunds
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_refund_request();
