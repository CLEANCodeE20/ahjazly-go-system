-- ========================================================
-- FIX RLS POLICIES FOR PARTNERS TABLE
-- Solves the "new row violates row-level security policy" error (42501)
-- when approving applications in AdminDashboard
-- ========================================================

-- 1. Ensure RLS is enabled
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to ensure a clean slate
DROP POLICY IF EXISTS "Enable read access for all users" ON public.partners;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.partners;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.partners;
DROP POLICY IF EXISTS "Public partners are viewable by everyone" ON public.partners;
DROP POLICY IF EXISTS "Partners can view own data" ON public.partners;
DROP POLICY IF EXISTS "Partners can update own data" ON public.partners;
DROP POLICY IF EXISTS "Admins can manage partners" ON public.partners;
DROP POLICY IF EXISTS "Admins can insert partners" ON public.partners;
DROP POLICY IF EXISTS "Admins and owners can update partners" ON public.partners;

-- 3. Create SELECT Policy
-- Everyone can view partners (for booking), but restricted fields should be handled by application logic if needed
-- Or better: restrict detailed view to owner and admin
CREATE POLICY "Public partners are viewable by everyone"
ON public.partners
FOR SELECT
USING (true);

-- 4. Create INSERT Policy
-- Only Admins/Superusers can create new partners (approving applications)
CREATE POLICY "Admins can insert partners"
ON public.partners
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT role FROM public.user_roles WHERE auth_id = auth.uid() LIMIT 1) IN ('SUPERUSER', 'ADMIN', 'PARTNER_ADMIN')
);

-- 5. Create UPDATE Policy
-- Admins can update any partner
-- Partners can update their own data (based on manager_auth_id)
CREATE POLICY "Admins and owners can update partners"
ON public.partners
FOR UPDATE
TO authenticated
USING (
  (auth.uid()::text = manager_auth_id::text)
  OR
  ((SELECT role FROM public.user_roles WHERE auth_id = auth.uid() LIMIT 1) IN ('SUPERUSER', 'ADMIN'))
)
WITH CHECK (
  (auth.uid()::text = manager_auth_id::text)
  OR
  ((SELECT role FROM public.user_roles WHERE auth_id = auth.uid() LIMIT 1) IN ('SUPERUSER', 'ADMIN'))
);

-- 6. Verification
SELECT schemaname, tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'partners';
