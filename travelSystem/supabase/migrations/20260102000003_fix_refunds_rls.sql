-- ========================================================
-- REFUND RLS POLICY FIX
-- Purpose: Allow partners/employees to update refund status
-- ========================================================

-- 1. Add Update Policy for Refunds
DROP POLICY IF EXISTS "Partners/Employees manage own refunds" ON public.refunds;

CREATE POLICY "Partners/Employees manage own refunds" ON public.refunds 
FOR ALL TO authenticated 
USING (
    booking_id IN (
        SELECT b.booking_id 
        FROM public.bookings b 
        JOIN public.trips t ON b.trip_id = t.trip_id 
        WHERE t.partner_id = get_current_partner_id()
    )
)
WITH CHECK (
    booking_id IN (
        SELECT b.booking_id 
        FROM public.bookings b 
        JOIN public.trips t ON b.trip_id = t.trip_id 
        WHERE t.partner_id = get_current_partner_id()
    )
);

-- Note: SELECT was already defined in previous migrations but we upgrade it to ALL
-- so it covers INSERT/UPDATE/DELETE within the partner scope.
