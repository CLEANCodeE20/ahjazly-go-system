-- ========================================================
-- SECURE REFUNDS VIEW & POLICIES
-- Purpose: Fix data leakage in Refund Management by enforcing RLS
-- ========================================================

BEGIN;

-- 1. Ensure RLS is enabled on refunds table
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

-- 2. Clean up existing policies to ensure no conflicts
DROP POLICY IF EXISTS "Refunds visibility" ON public.refunds;
DROP POLICY IF EXISTS "Partners/Employees manage own refunds" ON public.refunds;
DROP POLICY IF EXISTS "Users can see own refunds" ON public.refunds;

-- 3. Define Comprehensive SELECT Policy
CREATE POLICY "Refunds visibility" ON public.refunds
FOR SELECT TO authenticated
USING (
    -- 1. Superusers / Admins see all
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('SUPERUSER', 'admin')
    OR
    -- 2. Partners/Employees see refunds for their trips
    (
        EXISTS (
            SELECT 1 
            FROM public.bookings b
            JOIN public.trips t ON b.trip_id = t.trip_id
            WHERE b.booking_id = refunds.booking_id
            AND t.partner_id = (auth.jwt() -> 'app_metadata' ->> 'partner_id')::BIGINT
        )
    )
    OR
    -- 3. Travelers see their own refunds
    (auth_id = auth.uid())
);

-- 4. Define Update Policy (Re-applying for safety)
CREATE POLICY "Refunds management" ON public.refunds
FOR UPDATE TO authenticated
USING (
    -- Partners only manage their own refunds
    EXISTS (
        SELECT 1 
        FROM public.bookings b
        JOIN public.trips t ON b.trip_id = t.trip_id
        WHERE b.booking_id = refunds.booking_id
        AND t.partner_id = (auth.jwt() -> 'app_metadata' ->> 'partner_id')::BIGINT
    )
    OR
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('SUPERUSER', 'admin')
)
WITH CHECK (
    -- Partners only manage their own refunds
    EXISTS (
        SELECT 1 
        FROM public.bookings b
        JOIN public.trips t ON b.trip_id = t.trip_id
        WHERE b.booking_id = refunds.booking_id
        AND t.partner_id = (auth.jwt() -> 'app_metadata' ->> 'partner_id')::BIGINT
    )
    OR
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('SUPERUSER', 'admin')
);

-- 5. Recreate the View with Security Invoker
DROP VIEW IF EXISTS public.refunds_status_report CASCADE;

CREATE OR REPLACE VIEW public.refunds_status_report 
WITH (security_invoker = true) -- CRITICAL: Enforce RLS
AS
SELECT 
    r.refund_id,
    r.booking_id,
    r.auth_id,
    u.full_name as customer_name,
    r.refund_amount,
    r.refund_method,
    r.status,
    r.refund_reference,
    r.created_at as requested_at,
    r.processed_at,
    b.payment_method as original_payment_method,
    t.partner_id,
    r.rejection_reason,
    r.notes,
    -- Add processing details if needed
    NULL::text as processed_by_name,
    EXTRACT(EPOCH FROM (r.processed_at - r.created_at))/3600 as processing_hours
FROM public.refunds r
JOIN public.bookings b ON r.booking_id = b.booking_id
JOIN public.users u ON r.auth_id = u.auth_id
LEFT JOIN public.trips t ON b.trip_id = t.trip_id;


-- 6. Grant Access
GRANT SELECT ON public.refunds_status_report TO authenticated;

COMMIT;
