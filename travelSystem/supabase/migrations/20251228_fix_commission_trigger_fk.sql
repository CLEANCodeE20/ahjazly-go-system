-- Fix for commissions_booking_id_fkey violation
-- Problem: The previous trigger tried to insert into 'commissions' BEFORE the 'bookings' record was created.
-- Solution: Split into two triggers:
-- 1. BEFORE INSERT: Calculate platform_commission and partner_revenue.
-- 2. AFTER INSERT: Insert into commissions and booking_ledger (now that booking_id exists).

-- 1. Function to calculate values (runs BEFORE INSERT)
CREATE OR REPLACE FUNCTION public.calculate_booking_financials()
RETURNS TRIGGER AS $$
DECLARE
  partner_commission_rate NUMERIC;
  trip_partner_id BIGINT;
BEGIN
  -- Get partner_id from trip
  SELECT partner_id INTO trip_partner_id
  FROM public.trips
  WHERE trip_id = NEW.trip_id;

  -- Get commission percentage from partner (default 10%)
  SELECT COALESCE(commission_percentage, 10.00) INTO partner_commission_rate
  FROM public.partners
  WHERE partner_id = trip_partner_id;

  -- Calculate commission and partner revenue
  NEW.platform_commission := ROUND((NEW.total_price * partner_commission_rate / 100), 2);
  NEW.partner_revenue := NEW.total_price - NEW.platform_commission;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Function to create related records (runs AFTER INSERT)
CREATE OR REPLACE FUNCTION public.create_commission_records()
RETURNS TRIGGER AS $$
DECLARE
  partner_commission_rate NUMERIC;
  trip_partner_id BIGINT;
BEGIN
  -- Re-fetch necessary data
  SELECT partner_id INTO trip_partner_id
  FROM public.trips
  WHERE trip_id = NEW.trip_id;

  SELECT COALESCE(commission_percentage, 10.00) INTO partner_commission_rate
  FROM public.partners
  WHERE partner_id = trip_partner_id;

  -- Insert commission record (Now safe because booking_id exists)
  INSERT INTO public.commissions (
    booking_id,
    partner_id,
    trip_id,
    booking_amount,
    commission_percentage,
    commission_amount,
    partner_revenue,
    status,
    created_at
  ) VALUES (
    NEW.booking_id,
    trip_partner_id,
    NEW.trip_id,
    NEW.total_price,
    partner_commission_rate,
    NEW.platform_commission,
    NEW.partner_revenue,
    CASE WHEN NEW.payment_status = 'paid' THEN 'confirmed' ELSE 'pending' END,
    NOW()
  );

  -- Insert ledger entry
  INSERT INTO public.booking_ledger (
    booking_id,
    partner_id,
    amount,
    entry_type,
    currency,
    note,
    created_at
  ) VALUES (
    NEW.booking_id,
    trip_partner_id,
    NEW.total_price,
    'booking',
    'SAR',
    'حجز جديد رقم ' || NEW.booking_id,
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Update Triggers

-- Drop old single trigger
DROP TRIGGER IF EXISTS trigger_calculate_commission ON public.bookings;

-- Create new BEFORE trigger for calculations
DROP TRIGGER IF EXISTS trigger_calculate_financials ON public.bookings;
CREATE TRIGGER trigger_calculate_financials
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_booking_financials();

-- Create new AFTER trigger for record creation
DROP TRIGGER IF EXISTS trigger_create_commission_records ON public.bookings;
CREATE TRIGGER trigger_create_commission_records
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.create_commission_records();
