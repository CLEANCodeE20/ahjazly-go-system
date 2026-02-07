-- Fix Branch Data Leakage
-- Purpose: Restrict overly permissive branch visibility that caused partners to see other companies' branches.

BEGIN;

-- 1. Drop the problematic "Public" policy
DROP POLICY IF EXISTS "Public can view active branches" ON public.branches;
DROP POLICY IF EXISTS "Public Access for Branches" ON public.branches;

-- 2. Create a restricted Public/Traveler policy
-- This allows travelers to see active branches for booking purposes, 
-- but prevents Partner Admins from seeing them unless they belong to their company.
CREATE POLICY "Travelers can view active branches"
ON public.branches
FOR SELECT
TO authenticated, anon
USING (
    status = 'active' 
    AND (
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'TRAVELER'
        OR auth.role() = 'anon'
    )
);

-- 3. Ensure the Partner Management policy is robust
DROP POLICY IF EXISTS "Partners can manage own branches" ON public.branches;
CREATE POLICY "Partners can manage own branches"
ON public.branches
FOR ALL
TO authenticated
USING (
    partner_id = (SELECT (auth.jwt() -> 'app_metadata' ->> 'partner_id')::bigint)
    OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERUSER'
)
WITH CHECK (
    partner_id = (SELECT (auth.jwt() -> 'app_metadata' ->> 'partner_id')::bigint)
    OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERUSER'
);

COMMIT;
