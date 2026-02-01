-- ========================================================
-- UPDATE RBAC POLICIES (Granular Enforcement)
-- ========================================================

BEGIN;

-- TRIPS
DROP POLICY IF EXISTS "Authorized users can insert trips" ON public.trips;
CREATE POLICY "Authorized users can insert trips" ON public.trips
    FOR INSERT WITH CHECK (
        (partner_id = get_current_partner_id() AND check_permission('trips.create')) 
        OR has_role(auth.uid(), 'admin')
    );

DROP POLICY IF EXISTS "Authorized users can update trips" ON public.trips;
CREATE POLICY "Authorized users can update trips" ON public.trips
    FOR UPDATE USING (
        (partner_id = get_current_partner_id() AND check_permission('trips.edit')) 
        OR has_role(auth.uid(), 'admin')
    );

DROP POLICY IF EXISTS "Authorized users can delete trips" ON public.trips;
CREATE POLICY "Authorized users can delete trips" ON public.trips
    FOR DELETE USING (
        (partner_id = get_current_partner_id() AND check_permission('trips.delete')) 
        OR has_role(auth.uid(), 'admin')
    );

-- BOOKINGS
DROP POLICY IF EXISTS "Authorized users can manage bookings" ON public.bookings;
-- Split into Create/Update/Delete for granularity
CREATE POLICY "Authorized users can create bookings" ON public.bookings
    FOR INSERT WITH CHECK (
        (trip_id IN (SELECT trip_id FROM public.trips WHERE partner_id = get_current_partner_id()) AND check_permission('bookings.create'))
        OR has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Authorized users can update bookings" ON public.bookings
    FOR UPDATE USING (
        (trip_id IN (SELECT trip_id FROM public.trips WHERE partner_id = get_current_partner_id()) AND check_permission('bookings.edit'))
        OR has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Authorized users can delete bookings" ON public.bookings
    FOR DELETE USING (
        (trip_id IN (SELECT trip_id FROM public.trips WHERE partner_id = get_current_partner_id()) AND check_permission('bookings.cancel')) -- using cancel permission for delete
        OR has_role(auth.uid(), 'admin')
    );

-- FLEET (Buses)
DROP POLICY IF EXISTS "Authorized users can manage buses" ON public.buses;
CREATE POLICY "Authorized users can manage buses" ON public.buses
    FOR ALL USING (
        (partner_id = get_current_partner_id() AND check_permission('fleet.manage')) 
        OR has_role(auth.uid(), 'admin')
    );

-- ROUTES
DROP POLICY IF EXISTS "Authorized users can manage routes" ON public.routes;
CREATE POLICY "Authorized users can manage routes" ON public.routes
    FOR ALL USING (
        (partner_id = get_current_partner_id() AND check_permission('routes.manage')) 
        OR has_role(auth.uid(), 'admin')
    );

-- EMPLOYEES
DROP POLICY IF EXISTS "Authorized users can manage employees" ON public.employees;
CREATE POLICY "Authorized users can manage employees" ON public.employees
    FOR ALL USING (
        (partner_id = get_current_partner_id() AND check_permission('users.manage'))
        OR has_role(auth.uid(), 'admin')
    );

COMMIT;
