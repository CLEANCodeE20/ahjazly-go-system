-- EMERGENCY FIX: Revert get_current_partner_id to use user_roles
-- The previous change to use public.users caused issues because the admin's profile might not have partner_id set.
-- user_roles is the source of truth for partner association.

-- 1. Redefine get_current_partner_id to use user_roles
CREATE OR REPLACE FUNCTION public.get_current_partner_id()
RETURNS INTEGER
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT partner_id 
  FROM public.user_roles 
  WHERE user_id = auth.uid() 
  LIMIT 1;
$$;

-- 2. Update Users Insert Policy to be more permissive for partners
DROP POLICY IF EXISTS "Partners can insert employee users" ON public.users;

CREATE POLICY "Partners can insert employee users" ON public.users
FOR INSERT TO authenticated
WITH CHECK (
  user_type = 'employee' AND
  -- Check if the inserting user is a partner/admin for the partner_id being inserted
  (
    partner_id = (SELECT get_current_partner_id()) OR
    public.has_role(auth.uid(), 'admin')
  )
);

-- 3. Ensure SELECT permission exists so the client can receive the inserted data
DROP POLICY IF EXISTS "Partners can view own employees" ON public.users;

CREATE POLICY "Partners can view own employees" ON public.users
FOR SELECT TO authenticated
USING (
  partner_id = (SELECT get_current_partner_id()) OR 
  public.has_role(auth.uid(), 'admin')
);
