-- FINAL PERMISSION FIX
-- 1. Improve get_current_partner_id to use users table (more reliable)
CREATE OR REPLACE FUNCTION public.get_current_partner_id()
RETURNS INTEGER
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT partner_id 
  FROM public.users 
  WHERE auth_id = auth.uid() 
  LIMIT 1;
$$;

-- 2. Reset and Fix user_roles Policies
-- First, drop conflicting policies
DROP POLICY IF EXISTS "Partners can assign employee roles" ON public.user_roles;
DROP POLICY IF EXISTS "Partners can view employee roles" ON public.user_roles;
DROP POLICY IF EXISTS "Partners can manage employee roles" ON public.user_roles;

-- Create comprehensive policy for partners
CREATE POLICY "Partners can manage employee roles" ON public.user_roles
FOR ALL TO authenticated
USING (
  partner_id = (SELECT get_current_partner_id()) OR
  public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  partner_id = (SELECT get_current_partner_id()) AND
  role = 'employee'
);

-- 3. Reset and Fix employees Policies
DROP POLICY IF EXISTS "Partners can insert own employees" ON public.employees;
DROP POLICY IF EXISTS "Partners can update own employees" ON public.employees;
DROP POLICY IF EXISTS "Partners can delete own employees" ON public.employees;
DROP POLICY IF EXISTS "Partners can view own employees" ON public.employees;
DROP POLICY IF EXISTS "Partners can manage own employees" ON public.employees;

CREATE POLICY "Partners can manage own employees" ON public.employees
FOR ALL TO authenticated
USING (
  partner_id = (SELECT get_current_partner_id()) OR
  public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  partner_id = (SELECT get_current_partner_id()) OR
  public.has_role(auth.uid(), 'admin')
);

-- 4. Self-heal current partner record
UPDATE public.users 
SET partner_id = (SELECT partner_id FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1)
WHERE auth_id = auth.uid() AND partner_id IS NULL;
