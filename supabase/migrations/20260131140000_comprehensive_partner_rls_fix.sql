-- =============================================
-- COMPREHENSIVE PARTNER RLS FIX
-- Date: 2026-01-31
-- Purpose: Grant full access to PARTNER_ADMIN on all core operational tables
-- =============================================

BEGIN;

-- 1. ROUTES - Full access for partners to their routes
-- =============================================
DROP POLICY IF EXISTS "Public view" ON public.routes;
DROP POLICY IF EXISTS "Standard partner access" ON public.routes;

CREATE POLICY "Partner full access to routes" 
ON public.routes 
FOR ALL 
USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERUSER'
    OR (
        partner_id = (auth.jwt() -> 'app_metadata' ->> 'partner_id')::bigint
        AND (auth.jwt() -> 'app_metadata' ->> 'role') IN ('PARTNER_ADMIN', 'manager', 'accountant', 'support', 'supervisor')
    )
);

-- 2. BUSES - Full access for partners to their buses
-- =============================================
DROP POLICY IF EXISTS "Public view" ON public.buses;
DROP POLICY IF EXISTS "Standard partner access" ON public.buses;

CREATE POLICY "Partner full access to buses" 
ON public.buses 
FOR ALL 
USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERUSER'
    OR (
        partner_id = (auth.jwt() -> 'app_metadata' ->> 'partner_id')::bigint
        AND (auth.jwt() -> 'app_metadata' ->> 'role') IN ('PARTNER_ADMIN', 'manager', 'accountant', 'support', 'supervisor')
    )
);

-- 3. TRIPS - Full access for partners to trips on their routes
-- =============================================
DROP POLICY IF EXISTS "Drivers can view own trips" ON public.trips;
DROP POLICY IF EXISTS "Drivers can update own trips status" ON public.trips;
DROP POLICY IF EXISTS "Partner and driver access to trips" ON public.trips;

CREATE POLICY "Partner and driver full access to trips" 
ON public.trips 
FOR ALL 
USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERUSER'
    OR EXISTS (
        SELECT 1 FROM public.routes r
        WHERE r.route_id = trips.route_id
        AND r.partner_id = (auth.jwt() -> 'app_metadata' ->> 'partner_id')::bigint
        AND (auth.jwt() -> 'app_metadata' ->> 'role') IN ('PARTNER_ADMIN', 'manager', 'accountant', 'support', 'supervisor')
    )
    OR EXISTS (
        SELECT 1 FROM public.drivers d 
        WHERE d.driver_id = trips.driver_id 
        AND d.auth_id = auth.uid()
    )
);

-- 4. ROUTE_STOPS - Full access for partners to stops on their routes
-- =============================================
DROP POLICY IF EXISTS "Public view" ON public.route_stops;
DROP POLICY IF EXISTS "Partner and admin access to route_stops" ON public.route_stops;

CREATE POLICY "Partner full access to route_stops" 
ON public.route_stops 
FOR ALL 
USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERUSER'
    OR EXISTS (
        SELECT 1 FROM public.routes r
        WHERE r.route_id = route_stops.route_id
        AND r.partner_id = (auth.jwt() -> 'app_metadata' ->> 'partner_id')::bigint
        AND (auth.jwt() -> 'app_metadata' ->> 'role') IN ('PARTNER_ADMIN', 'manager', 'accountant', 'support', 'supervisor')
    )
    OR auth.role() = 'authenticated' -- Read-only for customers
);

-- 5. SEATS - Full access for partners to seats on their buses
-- =============================================
DROP POLICY IF EXISTS "Public view" ON public.seats;

CREATE POLICY "Partner and public access to seats" 
ON public.seats 
FOR ALL 
USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERUSER'
    OR EXISTS (
        SELECT 1 FROM public.buses b
        WHERE b.bus_id = seats.bus_id
        AND b.partner_id = (auth.jwt() -> 'app_metadata' ->> 'partner_id')::bigint
        AND (auth.jwt() -> 'app_metadata' ->> 'role') IN ('PARTNER_ADMIN', 'manager', 'accountant', 'support', 'supervisor')
    )
    OR auth.role() = 'authenticated' -- Read-only for customers
);

-- 6. CANCEL_POLICIES - Full access for partners to their policies
-- =============================================
DROP POLICY IF EXISTS "Public view" ON public.cancel_policies;
DROP POLICY IF EXISTS "Standard partner access" ON public.cancel_policies;

CREATE POLICY "Partner full access to cancel_policies" 
ON public.cancel_policies 
FOR ALL 
USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERUSER'
    OR (
        partner_id = (auth.jwt() -> 'app_metadata' ->> 'partner_id')::bigint
        AND (auth.jwt() -> 'app_metadata' ->> 'role') IN ('PARTNER_ADMIN', 'manager', 'accountant', 'support', 'supervisor')
    )
    OR auth.role() = 'authenticated' -- Read-only for customers
);

-- 7. BUS_CLASSES - Public read, admin write
-- =============================================
DROP POLICY IF EXISTS "Public view" ON public.bus_classes;

CREATE POLICY "Public read admin write for bus_classes" 
ON public.bus_classes 
FOR ALL 
USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERUSER'
    OR auth.role() = 'authenticated' -- Everyone can read
);

-- 8. BRANCHES - Partners can manage their branches
-- =============================================
DROP POLICY IF EXISTS "Public view" ON public.branches;

CREATE POLICY "Partner full access to branches" 
ON public.branches 
FOR ALL 
USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERUSER'
    OR (
        partner_id = (auth.jwt() -> 'app_metadata' ->> 'partner_id')::bigint
        AND (auth.jwt() -> 'app_metadata' ->> 'role') IN ('PARTNER_ADMIN', 'manager', 'accountant', 'support', 'supervisor')
    )
    OR auth.role() = 'authenticated' -- Read-only for customers
);

COMMIT;

-- Add helpful comments
COMMENT ON POLICY "Partner full access to routes" ON public.routes IS 'Allows SUPERUSER and PARTNER_ADMIN full CRUD on their routes';
COMMENT ON POLICY "Partner full access to buses" ON public.buses IS 'Allows SUPERUSER and PARTNER_ADMIN full CRUD on their buses';
COMMENT ON POLICY "Partner and driver full access to trips" ON public.trips IS 'Allows SUPERUSER, PARTNER_ADMIN, and assigned drivers access to trips';
COMMENT ON POLICY "Partner full access to route_stops" ON public.route_stops IS 'Allows SUPERUSER and PARTNER_ADMIN full CRUD on stops for their routes';
COMMENT ON POLICY "Partner and public access to seats" ON public.seats IS 'Allows SUPERUSER and PARTNER_ADMIN full CRUD on seats, customers can read';
COMMENT ON POLICY "Partner full access to cancel_policies" ON public.cancel_policies IS 'Allows SUPERUSER and PARTNER_ADMIN full CRUD on their cancellation policies';
