-- Add management policies for administrators on partners and user_roles tables
-- This fixes the RLS violation error during partner approval

-- Policies for partners table
DROP POLICY IF EXISTS "Admins can manage partners" ON public.partners;
CREATE POLICY "Admins can manage partners" ON public.partners
FOR ALL 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Policies for user_roles table
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
CREATE POLICY "Admins can manage user roles" ON public.user_roles
FOR ALL 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Ensure public read access remains
DROP POLICY IF EXISTS "Public read access for partners" ON public.partners;
CREATE POLICY "Public read access for partners" ON public.partners 
FOR SELECT USING (true);
