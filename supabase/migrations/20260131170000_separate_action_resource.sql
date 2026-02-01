-- =============================================
-- SEPARATE ACTION AND RESOURCE (Standard RBAC Phase 3)
-- Date: 2026-01-31
-- Purpose: Split permission_code into fine-grained Action and Resource columns
-- =============================================

BEGIN;

-- 1. Add columns to permissions table
-- =============================================
ALTER TABLE permissions
  ADD COLUMN IF NOT EXISTS action text,
  ADD COLUMN IF NOT EXISTS resource text;

-- 2. Add constraint for valid actions (Standard CRUD + Manage + Execute)
-- =============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_action_check'
  ) THEN
    ALTER TABLE permissions
      ADD CONSTRAINT valid_action_check 
      CHECK (action IN ('read', 'write', 'create', 'update', 'delete', 'manage', 'execute'));
  END IF;
END $$;

-- 3. Migrate existing data (Legacy -> Standard)
-- =============================================
-- Map 'view_%' -> read
UPDATE permissions
SET 
  action = 'read',
  resource = REGEXP_REPLACE(permission_code, '^view_', '')
WHERE permission_code LIKE 'view_%';

-- Map 'manage_%' -> manage
UPDATE permissions
SET 
  action = 'manage',
  resource = REGEXP_REPLACE(permission_code, '^manage_', '')
WHERE permission_code LIKE 'manage_%';

-- Map 'create_%' -> create
UPDATE permissions
SET 
  action = 'create',
  resource = REGEXP_REPLACE(permission_code, '^create_', '')
WHERE permission_code LIKE 'create_%';

-- Map 'update_%' -> update
UPDATE permissions
SET 
  action = 'update',
  resource = REGEXP_REPLACE(permission_code, '^update_', '')
WHERE permission_code LIKE 'update_%';

-- Map 'delete_%' -> delete
UPDATE permissions
SET 
  action = 'delete',
  resource = REGEXP_REPLACE(permission_code, '^delete_', '')
WHERE permission_code LIKE 'delete_%';

-- Handle logic specific codes (e.g. 'audit_logs') as read if not caught
UPDATE permissions
SET action = 'read', resource = permission_code
WHERE action IS NULL;

-- 4. Create Index for fast lookups
-- =============================================
CREATE INDEX IF NOT EXISTS idx_permissions_action_resource 
ON permissions(action, resource);

-- 5. Add comments
-- =============================================
COMMENT ON COLUMN permissions.action IS 'The operation being performed (read, write, delete, manage)';
COMMENT ON COLUMN permissions.resource IS 'The resource being accessed (trips, routes, payments)';

-- 6. Verification
-- =============================================
DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count FROM permissions WHERE action IS NOT NULL;
  RAISE NOTICE '✅ Migrated % permissions to Fine-Grained structure', v_count;
END $$;

COMMIT;
