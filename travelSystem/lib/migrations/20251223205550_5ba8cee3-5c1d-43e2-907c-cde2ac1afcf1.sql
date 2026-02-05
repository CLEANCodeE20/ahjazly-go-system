-- Create function to get current user's partner_id
CREATE OR REPLACE FUNCTION public.get_current_partner_id()
RETURNS INTEGER
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT partner_id FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1
$$;

-- Update RLS policies for partners table
DROP POLICY IF EXISTS "Public read access for partners" ON public.partners;

CREATE POLICY "Partners can view own data"
ON public.partners
FOR SELECT
TO authenticated
USING (
  partner_id = public.get_current_partner_id() OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Partners can update own data"
ON public.partners
FOR UPDATE
TO authenticated
USING (partner_id = public.get_current_partner_id())
WITH CHECK (partner_id = public.get_current_partner_id());

-- RLS for routes
DROP POLICY IF EXISTS "Public read access for routes" ON public.routes;

CREATE POLICY "Partners can view own routes"
ON public.routes
FOR SELECT
TO authenticated
USING (
  partner_id = public.get_current_partner_id() OR 
  partner_id IS NULL OR
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Partners can manage own routes"
ON public.routes
FOR ALL
TO authenticated
USING (partner_id = public.get_current_partner_id() OR partner_id IS NULL)
WITH CHECK (partner_id = public.get_current_partner_id() OR partner_id IS NULL);

-- RLS for route_stops
DROP POLICY IF EXISTS "Public read access for route_stops" ON public.route_stops;

CREATE POLICY "Anyone can view route stops"
ON public.route_stops
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Partners can manage route stops for own routes"
ON public.route_stops
FOR ALL
TO authenticated
USING (
  route_id IN (SELECT route_id FROM public.routes WHERE partner_id = public.get_current_partner_id())
  OR public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  route_id IN (SELECT route_id FROM public.routes WHERE partner_id = public.get_current_partner_id())
  OR public.has_role(auth.uid(), 'admin')
);

-- RLS for trips
DROP POLICY IF EXISTS "Public read access for trips" ON public.trips;

CREATE POLICY "Partners can view own trips"
ON public.trips
FOR SELECT
TO authenticated
USING (
  partner_id = public.get_current_partner_id() OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Partners can manage own trips"
ON public.trips
FOR ALL
TO authenticated
USING (partner_id = public.get_current_partner_id())
WITH CHECK (partner_id = public.get_current_partner_id());

-- RLS for buses
DROP POLICY IF EXISTS "Public read access for buses" ON public.buses;

CREATE POLICY "Partners can view own buses"
ON public.buses
FOR SELECT
TO authenticated
USING (
  partner_id = public.get_current_partner_id() OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Partners can manage own buses"
ON public.buses
FOR ALL
TO authenticated
USING (partner_id = public.get_current_partner_id())
WITH CHECK (partner_id = public.get_current_partner_id());

-- RLS for branches
DROP POLICY IF EXISTS "Public read access for branches" ON public.branches;

CREATE POLICY "Partners can view own branches"
ON public.branches
FOR SELECT
TO authenticated
USING (
  partner_id = public.get_current_partner_id() OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Partners can manage own branches"
ON public.branches
FOR ALL
TO authenticated
USING (partner_id = public.get_current_partner_id())
WITH CHECK (partner_id = public.get_current_partner_id());

-- RLS for employees
DROP POLICY IF EXISTS "Employees can view employee data" ON public.employees;

CREATE POLICY "Partners can view own employees"
ON public.employees
FOR SELECT
TO authenticated
USING (
  partner_id = public.get_current_partner_id() OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Partners can manage own employees"
ON public.employees
FOR ALL
TO authenticated
USING (partner_id = public.get_current_partner_id())
WITH CHECK (partner_id = public.get_current_partner_id());

-- RLS for drivers
DROP POLICY IF EXISTS "Public read access for drivers" ON public.drivers;

CREATE POLICY "Partners can view own drivers"
ON public.drivers
FOR SELECT
TO authenticated
USING (
  partner_id = public.get_current_partner_id() OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Partners can manage own drivers"
ON public.drivers
FOR ALL
TO authenticated
USING (partner_id = public.get_current_partner_id())
WITH CHECK (partner_id = public.get_current_partner_id());