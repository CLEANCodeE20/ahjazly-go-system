-- ========================================================
-- ADVANCED RBAC ENFORCEMENT (DATABASE LEVEL)
-- ========================================================

-- 1. Helper function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1
$$;

-- 2. Core permission check function
CREATE OR REPLACE FUNCTION public.check_permission(p_permission_code TEXT)
RETURNS BOOLEAN
LANGUAGE PLPGSQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role TEXT;
    v_partner_id INTEGER;
BEGIN
    -- 1. Get current user info from user_roles
    SELECT role, partner_id INTO v_role, v_partner_id 
    FROM public.user_roles 
    WHERE user_id = auth.uid() 
    LIMIT 1;

    -- 2. Admins have all permissions
    IF v_role = 'admin' THEN
        RETURN TRUE;
    END IF;

    -- 3. Partners (Owners) have all permissions for their company
    IF v_role = 'partner' THEN
        RETURN TRUE;
    END IF;

    -- 4. Check specific permissions for other roles (employees/managers)
    -- Logic: If partner has ANY custom permissions for this role, use ONLY those.
    -- Otherwise, fall back to system defaults (partner_id IS NULL).
    
    -- Check if partner has custom entries for this role
    IF EXISTS (SELECT 1 FROM public.role_permissions WHERE role = v_role AND partner_id = v_partner_id) THEN
        -- Use ONLY partner entries
        RETURN EXISTS (
            SELECT 1 
            FROM public.role_permissions 
            WHERE role = v_role 
              AND permission_code = p_permission_code
              AND partner_id = v_partner_id
        );
    ELSE
        -- Fall back to system defaults
        RETURN EXISTS (
            SELECT 1 
            FROM public.role_permissions 
            WHERE role = v_role 
              AND permission_code = p_permission_code
              AND partner_id IS NULL
        );
    END IF;
END;
$$;

-- 3. Update RLS Policies for Granular Enforcement

-- TRIPS
DROP POLICY IF EXISTS "Partners and Admins can manage trips" ON public.trips;

CREATE POLICY "Partners/Admins can view trips" ON public.trips
    FOR SELECT USING (partner_id = get_current_partner_id() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Authorized users can insert trips" ON public.trips
    FOR INSERT WITH CHECK (
        (partner_id = get_current_partner_id() AND check_permission('trips.manage')) 
        OR has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Authorized users can update trips" ON public.trips
    FOR UPDATE USING (
        (partner_id = get_current_partner_id() AND check_permission('trips.manage')) 
        OR has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Authorized users can delete trips" ON public.trips
    FOR DELETE USING (
        (partner_id = get_current_partner_id() AND check_permission('trips.manage')) 
        OR has_role(auth.uid(), 'admin')
    );

-- BUSES
DROP POLICY IF EXISTS "Partners and Admins can manage buses" ON public.buses;

CREATE POLICY "Partners/Admins can view buses" ON public.buses
    FOR SELECT USING (partner_id = get_current_partner_id() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Authorized users can manage buses" ON public.buses
    FOR ALL USING (
        (partner_id = get_current_partner_id() AND check_permission('fleet.manage')) 
        OR has_role(auth.uid(), 'admin')
    );

-- BOOKINGS
DROP POLICY IF EXISTS "Partners/Employees manage own bookings" ON public.bookings;

CREATE POLICY "Partners/Admins can view bookings" ON public.bookings
    FOR SELECT USING (
        trip_id IN (SELECT trip_id FROM public.trips WHERE partner_id = get_current_partner_id())
        OR has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Authorized users can manage bookings" ON public.bookings
    FOR ALL USING (
        (trip_id IN (SELECT trip_id FROM public.trips WHERE partner_id = get_current_partner_id()) AND check_permission('bookings.manage'))
        OR has_role(auth.uid(), 'admin')
    );

-- EMPLOYEES
DROP POLICY IF EXISTS "Partners/Employees manage own employees" ON public.employees;

CREATE POLICY "Authorized users can manage employees" ON public.employees
    FOR ALL USING (
        (partner_id = get_current_partner_id() AND check_permission('employees.manage'))
        OR has_role(auth.uid(), 'admin')
    );

-- ROUTES
DROP POLICY IF EXISTS "Partners and Admins can manage routes" ON public.routes;

CREATE POLICY "Partners/Admins can view routes" ON public.routes
    FOR SELECT USING (partner_id = get_current_partner_id() OR partner_id IS NULL OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Authorized users can manage routes" ON public.routes
    FOR ALL USING (
        (partner_id = get_current_partner_id() AND check_permission('routes.manage')) 
        OR has_role(auth.uid(), 'admin')
    );

-- DRIVERS
DROP POLICY IF EXISTS "Partners and Admins can manage drivers" ON public.drivers;

CREATE POLICY "Partners/Admins can view drivers" ON public.drivers
    FOR SELECT USING (partner_id = get_current_partner_id() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Authorized users can manage drivers" ON public.drivers
    FOR ALL USING (
        (partner_id = get_current_partner_id() AND check_permission('employees.manage')) 
        OR has_role(auth.uid(), 'admin')
    );

-- BRANCHES
DROP POLICY IF EXISTS "Partners/Employees manage own branches" ON public.branches;

CREATE POLICY "Authorized users can manage branches" ON public.branches
    FOR ALL USING (
        (partner_id = get_current_partner_id() AND check_permission('fleet.manage')) 
        OR has_role(auth.uid(), 'admin')
    );

-- SEATS
DROP POLICY IF EXISTS "Partners and Admins can manage seats" ON public.seats;

CREATE POLICY "Authorized users can manage seats" ON public.seats
    FOR ALL USING (
        (bus_id IN (SELECT bus_id FROM public.buses WHERE partner_id = get_current_partner_id()) AND check_permission('fleet.manage'))
        OR has_role(auth.uid(), 'admin')
    );
