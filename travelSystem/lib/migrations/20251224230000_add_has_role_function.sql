-- Add has_role() function for RLS policies
-- This function is used extensively in RLS policies to check user roles

-- 1. Create the has_role function
CREATE OR REPLACE FUNCTION public.has_role(user_id UUID, role_name TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_roles.user_id = $1 
    AND user_roles.role::text = $2
  );
$$;

-- 2. Add helpful comment
COMMENT ON FUNCTION public.has_role(UUID, TEXT) IS 
'Checks if a user has a specific role. Used in RLS policies.';

-- 3. Create index to improve performance of role checks
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role 
ON public.user_roles(user_id, role);

-- 4. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.has_role(UUID, TEXT) TO authenticated;
