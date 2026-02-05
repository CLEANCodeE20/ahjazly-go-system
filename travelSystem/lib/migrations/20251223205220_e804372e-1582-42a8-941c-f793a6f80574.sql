-- Create a function to add admin role (can be called after user signs up)
-- This allows the first admin to be added manually

-- Also update RLS to allow first admin creation when no admins exist
CREATE OR REPLACE FUNCTION public.is_first_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE role = 'admin'
  )
$$;

-- Allow first user to become admin if no admins exist
CREATE POLICY "First user can become admin"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  role = 'admin' AND public.is_first_admin() AND user_id = auth.uid()
);