-- Fix trips RLS to allow PARTNER_ADMIN full access
-- Date: 2026-01-31

-- Drop existing policies
DROP POLICY IF EXISTS "Drivers can view own trips" ON public.trips;
DROP POLICY IF EXISTS "Drivers can update own trips status" ON public.trips;

-- Create comprehensive policy for trips
CREATE POLICY "Partner and driver access to trips" 
ON public.trips 
FOR ALL 
USING (
    -- SUPERUSER has full access
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERUSER'
    OR
    -- Partner admins and managers have full access to trips on their routes
    (
        EXISTS (
            SELECT 1 FROM public.routes r
            WHERE r.route_id = trips.route_id
            AND r.partner_id = (auth.jwt() -> 'app_metadata' ->> 'partner_id')::bigint
        )
        AND (auth.jwt() -> 'app_metadata' ->> 'role') IN ('PARTNER_ADMIN', 'manager', 'accountant', 'support', 'supervisor')
    )
    OR
    -- Drivers can view and update their own trips
    EXISTS (
        SELECT 1 FROM public.drivers d 
        WHERE d.driver_id = trips.driver_id 
        AND d.auth_id = auth.uid()
    )
);

COMMENT ON POLICY "Partner and driver access to trips" ON public.trips IS 
'Allows SUPERUSER full access, PARTNER_ADMIN/managers access to trips on their routes, and drivers access to their assigned trips';
