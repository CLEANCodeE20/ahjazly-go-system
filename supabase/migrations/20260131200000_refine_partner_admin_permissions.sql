-- =============================================
-- REFINE PARTNER_ADMIN PERMISSIONS
-- Date: 2026-01-31
-- Purpose: Revoke platform-level permissions from PARTNER_ADMIN
-- =============================================

BEGIN;

-- 1. Remove Global/Platform Settings Permissions
-- We keep 'settings.profile' and 'settings.policies' as they are likely partner-specific
-- We remove 'settings.manage' and 'settings.edit' which usually imply Global System Config
DELETE FROM role_permissions 
WHERE role = 'PARTNER_ADMIN' 
AND permission_code IN ('settings.manage', 'settings.edit', 'settings.view');

-- 2. Remove Platform Management Permissions (if any exist)
-- Examples: managing other partners, managing global locations (cities), system logs
DELETE FROM role_permissions 
WHERE role = 'PARTNER_ADMIN' 
AND permission_code IN (
    'partners.manage', 'partners.create', 'partners.delete', 'partners.view',
    'system.settings', 'audit.view_all',
    'locations.manage', 'locations.create', 'locations.delete' -- Assuming cities are global
);

-- 3. Verification
DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count FROM role_permissions WHERE role = 'PARTNER_ADMIN';
  RAISE NOTICE '✅ PARTNER_ADMIN now has % permissions (Cleaned up)', v_count;
END $$;

COMMIT;
