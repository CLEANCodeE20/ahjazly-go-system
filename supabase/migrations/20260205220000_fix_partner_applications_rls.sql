-- ========================================================
-- FIX: Allow SUPERUSER to view all partner applications
-- ========================================================

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users view own application" ON public.partner_applications;

-- Recreate with admin access
CREATE POLICY "Users and admins view applications" 
ON public.partner_applications 
FOR SELECT TO authenticated 
USING (
  -- User can view their own application
  auth_user_id = auth.uid()
  OR
  -- OR user is SUPERUSER (check from user_roles)
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE auth_id = auth.uid()
    AND role = 'SUPERUSER'
  )
);

-- Also ensure admins can UPDATE applications (for approval/rejection)
DROP POLICY IF EXISTS "Admins can update applications" ON public.partner_applications;

CREATE POLICY "Admins can update applications"
ON public.partner_applications
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE auth_id = auth.uid()
    AND role = 'SUPERUSER'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE auth_id = auth.uid()
    AND role = 'SUPERUSER'
  )
);

-- Verify the policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'partner_applications'
ORDER BY policyname;
