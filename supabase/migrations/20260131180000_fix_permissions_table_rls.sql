-- =============================================
-- FIX PERMISSIONS TABLE ACCESS
-- Permissive policy for read access to permissions definition table
-- =============================================

BEGIN;

-- Enable RLS on permissions table (if not already)
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public read access" ON public.permissions;
DROP POLICY IF EXISTS "Authenticated users can view permissions" ON public.permissions;

-- Create a policy that allows authenticated users to read all permissions
CREATE POLICY "Authenticated users can view permissions"
ON public.permissions
FOR SELECT
USING (
  auth.role() = 'authenticated'
);

-- Also allow role_permissions to be joined
DROP POLICY IF EXISTS "Role permissions read access" ON public.role_permissions;

CREATE POLICY "Role permissions read access"
ON public.role_permissions
FOR SELECT
USING (
  auth.role() = 'authenticated'
);

COMMIT;
