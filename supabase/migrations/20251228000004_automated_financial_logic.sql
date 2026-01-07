-- ========================================================
-- STRATEGIC FINANCIAL ENGINE (PRODUCTION READY)
-- ========================================================

-- 1. Phase A: Calculation (BEFORE INSERT)
-- Goal: Ensure price and commission fields are correct before saving.
CREATE OR REPLACE FUNCTION public.fn_calculate_booking_totals()
RETURNS TRIGGER AS $$
DECLARE
    v_commission_pct NUMERIC;
BEGIN
    -- Get partner commission rate (Default 10%)
    SELECT COALESCE(p.commission_percentage, 10.00) 
    INTO v_commission_pct
    FROM public.trips t
    JOIN public.partners p ON p.partner_id = t.partner_id
    WHERE t.trip_id = NEW.trip_id;

    -- Calculate Fields
    NEW.platform_commission := ROUND((NEW.total_price * v_commission_pct / 100.0), 2);
    NEW.partner_revenue := NEW.total_price - NEW.platform_commission;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Phase B: Initialization (AFTER INSERT)
-- Goal: Create initial audit records (Ledger & Commission).
CREATE OR REPLACE FUNCTION public.fn_init_booking_audit()
RETURNS TRIGGER AS $$
DECLARE
    v_partner_id BIGINT;
    v_commission_pct NUMERIC;
BEGIN
    -- Get partner info
    SELECT t.partner_id, p.commission_percentage 
    INTO v_partner_id, v_commission_pct
    FROM public.trips t
    JOIN public.partners p ON p.partner_id = t.partner_id
    WHERE t.trip_id = NEW.trip_id;

    -- Create Initial Commission Record (Pending)
    INSERT INTO public.commissions (
        booking_id, partner_id, trip_id, booking_amount, 
        commission_percentage, commission_amount, partner_revenue, 
        status, notes
    ) VALUES (
        NEW.booking_id, v_partner_id, NEW.trip_id, NEW.total_price,
        v_commission_pct, NEW.platform_commission, NEW.partner_revenue,
        'pending', 'Initial allocation on booking creation'
    );

    -- Create Initial Ledger Entry
    INSERT INTO public.booking_ledger (booking_id, partner_id, entry_type, amount, note)
    VALUES (NEW.booking_id, v_partner_id, 'booking', NEW.total_price, 'Booking payment expectation created');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Phase C: Lifecycle Management (AFTER UPDATE)
-- Goal: Handle changes in payment/booking status.
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

        -- Final adjustment for cancellation fees
        IF (NEW.total_price - NEW.refund_amount) > 0 THEN
             INSERT INTO public.booking_ledger (booking_id, partner_id, entry_type, amount, note)
             VALUES (NEW.booking_id, v_partner_id, 'adjustment', (NEW.total_price - NEW.refund_amount), 'Cancellation fee adjustment');
        END IF;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Apply Triggers to Table
-- Cleanup
DROP TRIGGER IF EXISTS tr_handle_booking_financials ON public.bookings;
DROP TRIGGER IF EXISTS trigger_calculate_financials ON public.bookings;
DROP TRIGGER IF EXISTS trigger_create_commission_records ON public.bookings;

-- BEFORE INSERT
CREATE TRIGGER tr_01_calculate_totals
BEFORE INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.fn_calculate_booking_totals();

-- AFTER INSERT
CREATE TRIGGER tr_02_init_audit
AFTER INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.fn_init_booking_audit();

-- AFTER UPDATE
CREATE TRIGGER tr_03_handle_lifecycle
AFTER UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.fn_handle_booking_transitions();
