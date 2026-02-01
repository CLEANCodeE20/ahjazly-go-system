-- ========================================================
-- FINANCIAL LOGIC FIXES & ENHANCEMENTS
-- Date: 2026-01-23
-- Purpose: 
-- 1. Fix ledger doubling in cancellation
-- 2. Update partner_balance_report to use ledger for 100% accuracy
-- ========================================================

BEGIN;

-- 1. Fix fn_handle_booking_transitions (Remove redundant adjustment)
CREATE OR REPLACE FUNCTION public.fn_handle_booking_transitions()
RETURNS TRIGGER AS $$
DECLARE
    v_partner_id BIGINT;
BEGIN
    -- Get partner info
    SELECT partner_id INTO v_partner_id FROM public.trips WHERE trip_id = NEW.trip_id;

    -- A. PAYMENT CONFIRMED
    IF (NEW.booking_status = 'confirmed' AND NEW.payment_status = 'paid') 
       AND (OLD.payment_status != 'paid') THEN
        
        -- Update Commission status
        UPDATE public.commissions SET status = 'calculated' 
        WHERE booking_id = NEW.booking_id;

        -- Record Commission Deduction in Ledger
        INSERT INTO public.booking_ledger (booking_id, partner_id, entry_type, amount, note)
        VALUES (NEW.booking_id, v_partner_id, 'commission', -NEW.platform_commission, 'Platform commission collected');
        
    END IF;

    -- B. BOOKING CANCELLED & REFUNDED
    IF (NEW.booking_status = 'cancelled' AND NEW.payment_status = 'refunded')
       AND (OLD.payment_status != 'refunded') THEN
        
        -- Record Refund in Ledger
        INSERT INTO public.booking_ledger (booking_id, partner_id, entry_type, amount, note)
        VALUES (NEW.booking_id, v_partner_id, 'refund', -NEW.refund_amount, 'Booking refund processed');

        -- REMOVED: Redundant adjustment that was doubling the fee.
        -- The 'booking' entry + 'refund' entry already equals the cancellation fee.
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Update partner_balance_report to use Ledger (The "Clearing House" source of truth)
CREATE OR REPLACE VIEW public.partner_balance_report 
WITH (security_invoker = true)
AS
WITH partner_stats AS (
    SELECT 
        p.partner_id,
        p.company_name,
        -- Total earned is the SUM of all ledger entries (Bookings - Commissions - Refunds)
        COALESCE((
            SELECT SUM(amount) 
            FROM public.booking_ledger bl 
            WHERE bl.partner_id = p.partner_id
        ), 0) as total_earned,
        -- Total already settled (Paid to partner)
        COALESCE((
            SELECT SUM(amount) 
            FROM public.partner_settlements ps 
            WHERE ps.partner_id = p.partner_id AND ps.status = 'completed'
        ), 0) as total_settled,
        -- Total pending settlements
        COALESCE((
            SELECT SUM(amount) 
            FROM public.partner_settlements ps 
            WHERE ps.partner_id = p.partner_id AND ps.status = 'pending'
        ), 0) as total_pending_settlement
    FROM public.partners p
)
SELECT 
    *,
    (total_earned - total_settled) as current_balance,
    (total_earned - total_settled - total_pending_settlement) as available_for_settlement
FROM partner_stats;

COMMIT;
