-- STRICT DATA ISOLATION & RLS HARDENING
-- This migration fixes the issue where partners could see each other's data.
-- It implements a unified access control function and applies it to all operational tables.

BEGIN;

-- 1. UNIFIED ACCESS CONTROL FUNCTION
-- Ensures data is public for customers/guests but strictly isolated for partners/employees.
CREATE OR REPLACE FUNCTION public.can_view_data(_row_partner_id BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _user_id UUID := auth.uid();
    _role TEXT;
    _user_partner_id INTEGER;
BEGIN
    -- Case 1: Anonymous users (guests) -> Allow all (Public Browsing)
    IF _user_id IS NULL THEN
        RETURN TRUE;
    END IF;

    -- Case 2: Get user role and partner_id from user_roles
    SELECT role::text, partner_id INTO _role, _user_partner_id 
    FROM public.user_roles 
    WHERE user_id = _user_id 
    LIMIT 1;

    -- Case 3: Regular Customers (Authenticated but NO role record) -> Allow all
    IF _role IS NULL THEN
        RETURN TRUE;
    END IF;

    -- Case 4: Global Admins -> Allow all
    IF _role = 'admin' THEN
        RETURN TRUE;
    END IF;

    -- Case 5: Partners and Employees -> Strict Isolation
    -- They can only see data belonging to their company OR system-wide data (partner_id IS NULL)
    RETURN (_row_partner_id = _user_partner_id) OR (_row_partner_id IS NULL);
END;
$$;

-- 2. RESET POLICIES FOR OPERATIONAL TABLES
-- We will drop the generic "Public read access" policies and replace them with our unified check.

DO $$ 
DECLARE 
    t TEXT;
    -- Tables that have a partner_id column
    partner_tables TEXT[] := ARRAY[
        'partners', 'branches', 'employees', 'drivers', 'buses', 'routes', 
        'trips', 'cancel_policies', 'commissions', 'booking_ledger', 
        'partner_invoices', 'partner_payments'
    ];
BEGIN
    FOREACH t IN ARRAY partner_tables LOOP
        -- Drop problematic generic policies
        EXECUTE format('DROP POLICY IF EXISTS "Public read access for %I" ON public.%I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "Partners/Employees view own company" ON public.%I', t);
        
        -- Apply Unified View Policy
        EXECUTE format('CREATE POLICY "Unified view access for %I" ON public.%I FOR SELECT USING (public.can_view_data(partner_id))', t, t);
        
        -- Note: Management policies (INSERT/UPDATE/DELETE) should already be using get_current_partner_id() 
        -- but we'll re-verify/strengthen them in a bit if needed.
    END LOOP;
END $$;

-- 3. HANDLE TABLES WITHOUT DIRECT PARTNER_ID (Using Joins)

-- Route Stops (Check via route)
DROP POLICY IF EXISTS "Public read access for route_stops" ON public.route_stops;
DROP POLICY IF EXISTS "Anyone can view route stops" ON public.route_stops;
CREATE POLICY "Unified view access for route_stops" ON public.route_stops 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.routes r 
        WHERE r.route_id = public.route_stops.route_id 
        AND public.can_view_data(r.partner_id)
    )
);

-- Bookings (Join with trips)
-- Existing policy might be combined with OR, so we replace it.
DROP POLICY IF EXISTS "Public read access for bookings" ON public.bookings;
DROP POLICY IF EXISTS "Partners/Employees manage own bookings" ON public.bookings;
CREATE POLICY "Unified view access for bookings" ON public.bookings 
FOR SELECT 
USING (
    (user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid())) -- User's own bookings
    OR 
    EXISTS (
        SELECT 1 FROM public.trips t 
        WHERE t.trip_id = public.bookings.trip_id 
        AND public.can_view_data(t.partner_id)
    )
);

-- Passengers (Join with bookings)
DROP POLICY IF EXISTS "Public view access for passengers" ON public.passengers;
DROP POLICY IF EXISTS "Partners/Employees view own passengers" ON public.passengers;
CREATE POLICY "Unified view access for passengers" ON public.passengers 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.bookings b 
        JOIN public.trips t ON b.trip_id = t.trip_id
        WHERE b.booking_id = public.passengers.booking_id 
        AND public.can_view_data(t.partner_id)
    )
    OR
    (booking_id IN (SELECT booking_id FROM public.bookings WHERE user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid())))
);

COMMIT;
