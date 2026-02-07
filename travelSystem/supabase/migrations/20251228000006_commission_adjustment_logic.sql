-- ========================================================
-- ADVANCED FINANCIAL INTEGRATION (VERSION 2)
-- Handling Commission Reconciliation on Cancellation
-- ========================================================

CREATE OR REPLACE FUNCTION public.handle_booking_financials()
RETURNS TRIGGER AS $$
DECLARE
    v_partner_id BIGINT;
    v_commission_pct NUMERIC;
    v_commission_amt NUMERIC;
    v_partner_rev NUMERIC;
    v_cancellation_fee NUMERIC;
    v_old_commission NUMERIC;
    v_commission_refund NUMERIC;
BEGIN
    -- 1. Get partner and base commission percentage
    SELECT t.partner_id, p.commission_percentage 
    INTO v_partner_id, v_commission_pct
    FROM public.trips t
    JOIN public.partners p ON p.partner_id = t.partner_id
    WHERE t.trip_id = NEW.trip_id;

    -- CASE A: Booking confirmed and paid (Normal Flow)
    IF (NEW.booking_status = 'confirmed' AND NEW.payment_status = 'paid') 
       AND (OLD.booking_status != 'confirmed' OR OLD.payment_status != 'paid') THEN
        
        -- Calculate amounts based on total price
        v_commission_amt := (NEW.total_price * COALESCE(v_commission_pct, 10.00) / 100.0);
        v_partner_rev := NEW.total_price - v_commission_amt;

        -- Update booking fields
        NEW.platform_commission := v_commission_amt;
        NEW.partner_revenue := v_partner_rev;

        -- Save to commissions tracking
        INSERT INTO public.commissions (
            booking_id, partner_id, trip_id, booking_amount, 
            commission_percentage, commission_amount, partner_revenue, 
            status, notes
        ) VALUES (
            NEW.booking_id, v_partner_id, NEW.trip_id, NEW.total_price, 
            v_commission_pct, v_commission_amt, v_partner_rev, 
            'calculated', 'Booking confirmed: Full commission deducted'
        );

        -- Record in Ledger
        INSERT INTO public.booking_ledger (booking_id, partner_id, entry_type, amount, note)
        VALUES (NEW.booking_id, v_partner_id, 'booking', NEW.total_price, 'Total payment received from customer');

        INSERT INTO public.booking_ledger (booking_id, partner_id, entry_type, amount, note)
        VALUES (NEW.booking_id, v_partner_id, 'commission', -v_commission_amt, 'Platform commission fee');

    END IF;

    -- CASE B: Booking cancelled and refunded (Adjustment Flow)
    IF (NEW.booking_status = 'cancelled' AND NEW.payment_status = 'refunded')
       AND (OLD.payment_status != 'refunded') THEN
        
        v_cancellation_fee := NEW.total_price - NEW.refund_amount;
        v_old_commission := COALESCE(NEW.platform_commission, 0);

        -- If there's a cancellation fee, platform takes commission ONLY on the fee
        -- If it's a 100% refund, platform takes 0
        IF v_cancellation_fee > 0 THEN
            v_commission_amt := (v_cancellation_fee * COALESCE(v_commission_pct, 10.00) / 100.0);
        ELSE
            v_commission_amt := 0;
        END IF;

        -- The difference to be returned to the partner's wallet/balance
        v_commission_refund := v_old_commission - v_commission_amt;

        -- Update booking fields to reflect the final net state
        NEW.platform_commission := v_commission_amt;
        NEW.partner_revenue := v_cancellation_fee - v_commission_amt;

        -- Record the refund details in ledger
        -- 1. Full original amount going out to the customer
        INSERT INTO public.booking_ledger (booking_id, partner_id, entry_type, amount, note)
        VALUES (NEW.booking_id, v_partner_id, 'refund', -NEW.refund_amount, 'Refund returned to customer');

        -- 2. Adjust commission (Return the portion that platform shouldn't take)
        IF v_commission_refund != 0 THEN
            INSERT INTO public.booking_ledger (booking_id, partner_id, entry_type, amount, note)
            VALUES (NEW.booking_id, v_partner_id, 'adjustment', v_commission_refund, 'Commission refund: Platform adjusted its cut based on cancellation');
        END IF;

        -- 3. Update commission record status
        UPDATE public.commissions 
        SET status = 'cancelled', 
            notes = 'Booking cancelled. Final platform cut: ' || v_commission_amt 
        WHERE booking_id = NEW.booking_id;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
