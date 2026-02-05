-- Fix RLS policies for route_stops table
-- Partners need to be able to INSERT/UPDATE/DELETE stops for their own routes

-- 1. Enable RLS (just in case)
ALTER TABLE public.route_stops ENABLE ROW LEVEL SECURITY;

-- 2. Drop any conflicting existing policies for route_stops (except public/admin ones if they share names, but specific partner ones likely don't exist)
DROP POLICY IF EXISTS "Partners/Employees manage own route_stops" ON public.route_stops;
DROP POLICY IF EXISTS "Partners manage own route_stops" ON public.route_stops;

-- 3. Create Policy for Partners/Employees via JOIN on routes table
-- Since route_stops doesn't have partner_id, we check the parent route's partner_id
CREATE POLICY "Partners manage own route_stops" ON public.route_stops
FOR ALL TO authenticated
USING (
  route_id IN (
    SELECT route_id 
    FROM public.routes 
    WHERE partner_id = (SELECT get_current_partner_id())
  )
)
WITH CHECK (
  route_id IN (
    SELECT route_id 
    FROM public.routes 
    WHERE partner_id = (SELECT get_current_partner_id())
  )
);
