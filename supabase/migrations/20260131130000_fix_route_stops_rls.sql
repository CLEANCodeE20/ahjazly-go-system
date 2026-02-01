-- Fix route_stops RLS to allow PARTNER_ADMIN full access
-- Date: 2026-01-31

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Public view" ON public.route_stops;

-- Create comprehensive policy for route_stops
CREATE POLICY "Partner and admin access to route_stops" 
ON public.route_stops 
FOR ALL 
USING (
    -- SUPERUSER has full access
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERUSER'
    OR
    -- Partner admins and managers have full access to their routes
    (
        EXISTS (
            SELECT 1 FROM public.routes r
            WHERE r.route_id = route_stops.route_id
            AND r.partner_id = (auth.jwt() -> 'app_metadata' ->> 'partner_id')::bigint
        )
        AND (auth.jwt() -> 'app_metadata' ->> 'role') IN ('PARTNER_ADMIN', 'manager', 'accountant', 'support', 'supervisor')
    )
    OR
    -- Public read access for customers
    (
        auth.role() = 'authenticated' 
        AND current_setting('request.method', true) = 'GET'
    )
);

COMMENT ON POLICY "Partner and admin access to route_stops" ON public.route_stops IS 
'Allows SUPERUSER full access, PARTNER_ADMIN/managers access to their own route stops, and authenticated users read-only access';
