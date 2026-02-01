-- =============================================
-- FIX role_permissions RLS POLICIES
-- Date: 2026-01-31
-- Purpose: Enable access to role_permissions table
-- =============================================

BEGIN;

-- Enable RLS on role_permissions
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public read access" ON public.role_permissions;
DROP POLICY IF EXISTS "Admin full access" ON public.role_permissions;
DROP POLICY IF EXISTS "Users can view role permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Admins can manage permissions" ON public.role_permissions;

-- Policy 1: Allow authenticated users to read their role's permissions
CREATE POLICY "Users can view role permissions"
ON public.role_permissions
FOR SELECT
USING (
    -- SUPERUSER can see all
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERUSER'
    OR
    -- Users can see permissions for their own role
    role = (auth.jwt() -> 'app_metadata' ->> 'role')
    OR
    -- Users can see global permissions (partner_id is null)
    partner_id IS NULL
    OR
    -- Users can see permissions for their partner
    partner_id = (auth.jwt() -> 'app_metadata' ->> 'partner_id')::integer
);

-- Policy 2: Only SUPERUSER can manage permissions
-- Policy 2: Admins (SUPERUSER and PARTNER_ADMIN) can manage permissions
CREATE POLICY "Admins can manage permissions"
ON public.role_permissions
FOR ALL
USING (
    -- SUPERUSER manages all
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERUSER'
    OR
    -- PARTNER_ADMIN manages their own partner permissions
    (
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'PARTNER_ADMIN'
        AND
        partner_id = (auth.jwt() -> 'app_metadata' ->> 'partner_id')::integer
    )
)
WITH CHECK (
    -- SUPERUSER manages all
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERUSER'
    OR
    -- PARTNER_ADMIN manages their own partner permissions
    (
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'PARTNER_ADMIN'
        AND
        partner_id = (auth.jwt() -> 'app_metadata' ->> 'partner_id')::integer
    )
);

COMMIT;

COMMENT ON POLICY "Users can view role permissions" ON public.role_permissions IS 
'Allows users to view permissions for their role and partner';

COMMENT ON POLICY "Admins can manage permissions" ON public.role_permissions IS 
'Only SUPERUSER can create, update, or delete permissions';
