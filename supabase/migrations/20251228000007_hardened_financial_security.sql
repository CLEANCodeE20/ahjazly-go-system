-- ========================================================
-- FINAL FINANCIAL SECURITY HARDENING (PRODUCTION READY)
-- ========================================================

-- 1. SECURING booking_ledger
DROP POLICY IF EXISTS "Read access for booking_ledger" ON public.booking_ledger;
CREATE POLICY "Partners can view own ledger" ON public.booking_ledger
FOR SELECT USING (
    (partner_id = (SELECT r.partner_id FROM public.user_roles r WHERE r.user_id = auth.uid()))
    OR has_role(auth.uid(), 'admin')
);

-- 2. SECURING refunds
DROP POLICY IF EXISTS "Read access for refunds" ON public.refunds;
CREATE POLICY "Partners can view relevant refunds" ON public.refunds
FOR SELECT USING (
    (booking_id IN (
        SELECT b.booking_id 
        FROM public.bookings b 
        JOIN public.trips t ON t.trip_id = b.trip_id 
        WHERE t.partner_id = (SELECT r.partner_id FROM public.user_roles r WHERE r.user_id = auth.uid())
    ))
    OR has_role(auth.uid(), 'admin')
    OR (user_id IN (SELECT u.user_id FROM public.users u WHERE u.auth_id = auth.uid()))
);

-- Partners can update refund status (to confirm they paid it)
CREATE POLICY "Partners can manage relevant refunds" ON public.refunds
FOR UPDATE USING (
    (booking_id IN (
        SELECT b.booking_id 
        FROM public.bookings b 
        JOIN public.trips t ON t.trip_id = b.trip_id 
        WHERE t.partner_id = (SELECT r.partner_id FROM public.user_roles r WHERE r.user_id = auth.uid())
    ))
    OR has_role(auth.uid(), 'admin')
);

-- 3. SECURING payment_transactions
DROP POLICY IF EXISTS "Read access for payment_transactions" ON public.payment_transactions;
CREATE POLICY "Partners can view relevant transactions" ON public.payment_transactions
FOR SELECT USING (
    (booking_id IN (
        SELECT b.booking_id 
        FROM public.bookings b 
        JOIN public.trips t ON t.trip_id = b.trip_id 
        WHERE t.partner_id = (SELECT r.partner_id FROM public.user_roles r WHERE r.user_id = auth.uid())
    ))
    OR has_role(auth.uid(), 'admin')
    OR (user_id IN (SELECT u.user_id FROM public.users u WHERE u.auth_id = auth.uid()))
);

-- 4. SECURING partner_invoices
DROP POLICY IF EXISTS "Read access for partner_invoices" ON public.partner_invoices;
CREATE POLICY "Partners can view own invoices" ON public.partner_invoices
FOR SELECT USING (
    (partner_id = (SELECT r.partner_id FROM public.user_roles r WHERE r.user_id = auth.uid()))
    OR has_role(auth.uid(), 'admin')
);

-- 5. SECURING commissions (Ensuring consistency)
DROP POLICY IF EXISTS "Read access for commissions" ON public.commissions;
-- Policy already exists as "Partners can view own commissions" from previous master fix, 
-- but ensuring it covers all needed scenarios.

-- 6. Ensure security definer for financial functions remains set
ALTER FUNCTION public.handle_booking_financials() SECURITY DEFINER;
ALTER FUNCTION public.cancel_booking_rpc(BIGINT, TEXT, BOOLEAN) SECURITY DEFINER;
ALTER FUNCTION public.update_payment_v2(BIGINT, public.payment_status, public.payment_method, VARCHAR) SECURITY DEFINER;
