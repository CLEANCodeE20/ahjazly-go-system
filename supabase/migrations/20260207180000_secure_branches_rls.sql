-- Secure Branches Table with Strict RLS
-- This migration ensures that partners can ONLY see their own branches.

BEGIN;

-- 1. Enable RLS on branches (just in case)
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing weak policies
DROP POLICY IF EXISTS "Partners can view own branches" ON public.branches;
DROP POLICY IF EXISTS "Partners can manage own branches" ON public.branches;
DROP POLICY IF EXISTS "Admins can view all branches" ON public.branches;
DROP POLICY IF EXISTS "Users can view active branches" ON public.branches;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.branches;

-- 3. Create Strict Policies

-- Policy for Partners: View/Edit/Delete ONLY their own branches
CREATE POLICY "Partners can manage own branches"
ON public.branches
FOR ALL
USING (
    partner_id = (SELECT partner_id FROM public.user_roles WHERE auth_id = auth.uid() LIMIT 1)
    OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE auth_id = auth.uid() AND role = 'SUPERUSER')
)
WITH CHECK (
    partner_id = (SELECT partner_id FROM public.user_roles WHERE auth_id = auth.uid() LIMIT 1)
    OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE auth_id = auth.uid() AND role = 'SUPERUSER')
);

-- Policy for Public/Users: View ONLY active branches (if needed for booking)
CREATE POLICY "Public can view active branches"
ON public.branches
FOR SELECT
USING (status = 'active');

COMMIT;
