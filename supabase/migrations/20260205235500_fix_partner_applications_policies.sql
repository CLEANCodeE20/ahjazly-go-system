-- ========================================================
-- FIX RLS POLICIES FOR PARTNER APPLICATIONS
-- Solves the "new row violates row-level security policy" error (42501)
-- ========================================================

-- 1. Ensure RLS is enabled
ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to ensure a clean slate
DROP POLICY IF EXISTS "Users view own application" ON public.partner_applications;
DROP POLICY IF EXISTS "Users insert own application" ON public.partner_applications;
DROP POLICY IF EXISTS "Users and admins view applications" ON public.partner_applications;
DROP POLICY IF EXISTS "Admins can update applications" ON public.partner_applications;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.partner_applications;

-- 3. Create INSERT Policy (Critical for fixing the 42501 error)
-- Allows any authenticated user to submit an application
CREATE POLICY "Users can submit applications"
ON public.partner_applications
FOR INSERT 
TO authenticated 
WITH CHECK (
  auth_user_id = auth.uid()
);

-- 4. Create SELECT Policy
-- Users can see their own applications, Admin/Superuser can see all
CREATE POLICY "Users and admins view applications"
ON public.partner_applications
FOR SELECT 
TO authenticated 
USING (
  auth_user_id = auth.uid() 
  OR 
  (SELECT role FROM public.user_roles WHERE auth_id = auth.uid() LIMIT 1) IN ('SUPERUSER', 'PARTNER_ADMIN', 'ADMIN')
);

-- 5. Create UPDATE Policy
-- Only Admins can update status/reject applications
CREATE POLICY "Admins can update applications"
ON public.partner_applications
FOR UPDATE 
TO authenticated 
USING (
  (SELECT role FROM public.user_roles WHERE auth_id = auth.uid() LIMIT 1) IN ('SUPERUSER', 'ADMIN')
)
WITH CHECK (
  (SELECT role FROM public.user_roles WHERE auth_id = auth.uid() LIMIT 1) IN ('SUPERUSER', 'ADMIN')
);

-- 6. Verification
SELECT schemaname, tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'partner_applications';
