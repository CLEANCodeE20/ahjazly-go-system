-- Create function to calculate commission on booking insert
CREATE OR REPLACE FUNCTION public.calculate_booking_commission()
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

  -- Insert commission record
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

-- Create trigger for booking commission calculation
DROP TRIGGER IF EXISTS trigger_calculate_commission ON public.bookings;
CREATE TRIGGER trigger_calculate_commission
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_booking_commission();

-- Update commission status when payment is confirmed
CREATE OR REPLACE FUNCTION public.update_commission_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'paid' AND OLD.payment_status = 'pending' THEN
    UPDATE public.commissions
    SET status = 'confirmed'
    WHERE booking_id = NEW.booking_id;
  END IF;
  
  IF NEW.booking_status = 'cancelled' THEN
    UPDATE public.commissions
    SET status = 'cancelled'
    WHERE booking_id = NEW.booking_id;
    
    -- Add refund ledger entry
    INSERT INTO public.booking_ledger (
      booking_id,
      partner_id,
      amount,
      entry_type,
      currency,
      note,
      created_at
    ) SELECT
      NEW.booking_id,
      c.partner_id,
      -NEW.total_price,
      'refund',
      'SAR',
      'إلغاء حجز رقم ' || NEW.booking_id,
      NOW()
    FROM public.commissions c
    WHERE c.booking_id = NEW.booking_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for payment status update
DROP TRIGGER IF EXISTS trigger_update_commission_on_payment ON public.bookings;
CREATE TRIGGER trigger_update_commission_on_payment
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_commission_on_payment();

-- Add RLS policies for commissions table
DROP POLICY IF EXISTS "Partners can view own commissions" ON public.commissions;
CREATE POLICY "Partners can view own commissions"
  ON public.commissions
  FOR SELECT
  USING (partner_id = get_current_partner_id() OR has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage all commissions" ON public.commissions;
CREATE POLICY "Admins can manage all commissions"
  ON public.commissions
  FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Add RLS policies for partner_invoices
DROP POLICY IF EXISTS "Partners can view own invoices" ON public.partner_invoices;
CREATE POLICY "Partners can view own invoices"
  ON public.partner_invoices
  FOR SELECT
  USING (partner_id = get_current_partner_id() OR has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage all invoices" ON public.partner_invoices;
CREATE POLICY "Admins can manage all invoices"
  ON public.partner_invoices
  FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Add RLS policies for booking_ledger
DROP POLICY IF EXISTS "Partners can view own ledger" ON public.booking_ledger;
CREATE POLICY "Partners can view own ledger"
  ON public.booking_ledger
  FOR SELECT
  USING (partner_id = get_current_partner_id() OR has_role(auth.uid(), 'admin'));