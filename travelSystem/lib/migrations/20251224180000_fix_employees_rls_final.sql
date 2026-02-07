-- Comprehensive RLS fix for employees table
-- Splitting "FOR ALL" into specific policies to ensure INSERT works correctly without "USING" clause interference

-- 1. Drop existing policies on employees
DROP POLICY IF EXISTS "Employees can view employee data" ON public.employees;
DROP POLICY IF EXISTS "Partners can view own employees" ON public.employees;
DROP POLICY IF EXISTS "Partners can manage own employees" ON public.employees;

-- 2. Create specific policies

-- SELECT: Partners can view employees belonging to their partner_id
CREATE POLICY "Partners can view own employees" ON public.employees
FOR SELECT TO authenticated
USING (
  partner_id = (SELECT get_current_partner_id()) OR 
  public.has_role(auth.uid(), 'admin')
);

-- INSERT: Partners can insert employees for their own partner_id
CREATE POLICY "Partners can insert own employees" ON public.employees
FOR INSERT TO authenticated
WITH CHECK (
  partner_id = (SELECT get_current_partner_id()) OR
  public.has_role(auth.uid(), 'admin')
);

-- UPDATE: Partners can update employees belonging to their partner_id
CREATE POLICY "Partners can update own employees" ON public.employees
FOR UPDATE TO authenticated
USING (
  partner_id = (SELECT get_current_partner_id()) OR
  public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  partner_id = (SELECT get_current_partner_id()) OR
  public.has_role(auth.uid(), 'admin')
);

-- DELETE: Partners can delete employees belonging to their partner_id
CREATE POLICY "Partners can delete own employees" ON public.employees
FOR DELETE TO authenticated
USING (
  partner_id = (SELECT get_current_partner_id()) OR
  public.has_role(auth.uid(), 'admin')
);
