-- =============================================
-- ADD ROLE HIERARCHY TO EXISTING ROLES TABLE
-- Date: 2026-01-31
-- Purpose: Add parent_role_id and hierarchy support
-- =============================================

BEGIN;

-- =============================================
-- STEP 1: Add missing columns
-- =============================================

ALTER TABLE roles
  ADD COLUMN IF NOT EXISTS parent_role_id bigint REFERENCES roles(id),
  ADD COLUMN IF NOT EXISTS level integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS description text;

-- Fix ID column to be auto-incrementing if it's not
DO $$
BEGIN
  -- Check if id column has a sequence attached
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'roles' AND column_name = 'id' 
    AND (column_default LIKE 'nextval%' OR is_identity = 'YES')
  ) THEN
    -- If not, make it SERIAL (or IDENTITY)
    -- Since we can't easily alter to SERIAL, we create a sequence
    CREATE SEQUENCE IF NOT EXISTS roles_id_seq;
    
    -- Sync sequence with max id
    PERFORM setval('roles_id_seq', (SELECT MAX(id) FROM roles));
    
    -- Set default value
    ALTER TABLE roles ALTER COLUMN id SET DEFAULT nextval('roles_id_seq');
  END IF;
END $$;

-- =============================================
-- STEP 2: Update existing roles with hierarchy
-- =============================================

-- SUPERUSER - Top level
UPDATE roles SET 
  parent_role_id = NULL,
  level = 0,
  description = 'صلاحيات كاملة للنظام - أعلى مستوى'
WHERE name = 'SUPERUSER';

-- TRAVELER - Independent role
UPDATE roles SET 
  parent_role_id = NULL,
  level = 1,
  description = 'مستخدم عادي - مسافر'
WHERE name = 'TRAVELER';

-- PARTNER_ADMIN - Top partner role
UPDATE roles SET 
  parent_role_id = NULL,
  level = 1,
  description = 'مدير الشركة الشريكة - صلاحيات كاملة للشركة'
WHERE name = 'PARTNER_ADMIN';

-- PARTNER_EMPLOYEE - Inherits from PARTNER_ADMIN
UPDATE roles SET 
  parent_role_id = (SELECT id FROM roles WHERE name = 'PARTNER_ADMIN'),
  level = 2,
  description = 'موظف في الشركة الشريكة - يرث صلاحيات مدير الشركة'
WHERE name = 'PARTNER_EMPLOYEE';

-- CUSTOMER_SUPPORT - Inherits from PARTNER_EMPLOYEE
UPDATE roles SET 
  parent_role_id = (SELECT id FROM roles WHERE name = 'PARTNER_EMPLOYEE'),
  level = 3,
  description = 'دعم العملاء - يرث من موظف الشريك'
WHERE name = 'CUSTOMER_SUPPORT';

-- DRIVER - Independent role
UPDATE roles SET 
  parent_role_id = NULL,
  level = 1,
  description = 'سائق - صلاحيات محدودة للرحلات المخصصة'
WHERE name = 'DRIVER';

-- AGENT - Independent role
UPDATE roles SET 
  parent_role_id = NULL,
  level = 1,
  description = 'وكيل حجز - صلاحيات الحجز والعمولات'
WHERE name = 'AGENT';

-- =============================================
-- STEP 3: Add missing roles with hierarchy
-- =============================================

-- Check and insert manager
INSERT INTO roles (name, display_name_ar, parent_role_id, level, description)
SELECT 
  'manager',
  'مدير فرع',
  (SELECT id FROM roles WHERE name = 'PARTNER_ADMIN'),
  2,
  'مدير فرع - يرث من مدير الشركة'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'manager');

-- Check and insert accountant
INSERT INTO roles (name, display_name_ar, parent_role_id, level, description)
SELECT 
  'accountant',
  'محاسب',
  (SELECT id FROM roles WHERE name = 'manager'),
  3,
  'محاسب - يرث من مدير الفرع'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'accountant');

-- Check and insert support
INSERT INTO roles (name, display_name_ar, parent_role_id, level, description)
SELECT 
  'support',
  'دعم فني',
  (SELECT id FROM roles WHERE name = 'PARTNER_EMPLOYEE'),
  3,
  'دعم فني - يرث من موظف الشريك'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'support');

-- Check and insert supervisor
INSERT INTO roles (name, display_name_ar, parent_role_id, level, description)
SELECT 
  'supervisor',
  'مشرف',
  (SELECT id FROM roles WHERE name = 'PARTNER_ADMIN'),
  2,
  'مشرف - يرث من مدير الشركة'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'supervisor');

-- =============================================
-- STEP 4: Update user_roles to use role_id
-- =============================================

-- Add role_id column
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS role_id bigint REFERENCES roles(id);

-- Migrate data from role enum to role_id
UPDATE user_roles ur
SET role_id = r.id
FROM roles r
WHERE ur.role::text = r.name
AND ur.role_id IS NULL;

-- Make role_id valid for future inserts (optional constraint for now)
-- We keep 'role' column for backward compatibility for now
-- but ideally we should switch completely to role_id

-- Create index on role_id
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);

-- =============================================
-- STEP 5: Update role_permissions to use role_id
-- =============================================

-- Add role_id column
ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS role_id bigint REFERENCES roles(id);

-- Migrate data from role enum to role_id
UPDATE role_permissions rp
SET role_id = r.id
FROM roles r
WHERE rp.role::text = r.name
AND rp.role_id IS NULL;

-- Create index on role_id
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);

-- =============================================
-- STEP 6: Create hierarchy functions
-- =============================================

-- Function to get all inherited roles
CREATE OR REPLACE FUNCTION get_inherited_roles(p_role_id bigint)
RETURNS TABLE(role_id bigint, role_name text, role_level integer) AS $$
  WITH RECURSIVE role_hierarchy AS (
    -- Start with the given role
    SELECT id, name, level, parent_role_id
    FROM roles
    WHERE id = p_role_id
    
    UNION
    
    -- Recursively get parent roles
    SELECT r.id, r.name, r.level, r.parent_role_id
    FROM roles r
    INNER JOIN role_hierarchy rh ON r.id = rh.parent_role_id
  )
  SELECT id, name, level
  FROM role_hierarchy
  ORDER BY level;
$$ LANGUAGE sql STABLE;

COMMENT ON FUNCTION get_inherited_roles IS 
'Returns all roles inherited by a given role, including the role itself. Ordered by level (lowest to highest).';

-- Function to get all inherited permissions for a user
CREATE OR REPLACE FUNCTION get_inherited_permissions(p_auth_id uuid)
RETURNS TABLE(permission_code text) AS $$
  WITH user_role_ids AS (
    -- Get all direct roles for the user
    SELECT role_id FROM user_roles WHERE auth_id = p_auth_id
  ),
  all_inherited_roles AS (
    -- Get all inherited roles (including direct roles)
    SELECT DISTINCT ihr.role_id
    FROM user_role_ids uri
    CROSS JOIN LATERAL get_inherited_roles(uri.role_id) ihr
  )
  -- Get all permissions for all inherited roles
  SELECT DISTINCT rp.permission_code
  FROM all_inherited_roles air
  JOIN role_permissions rp ON rp.role_id = air.role_id;
$$ LANGUAGE sql STABLE;

COMMENT ON FUNCTION get_inherited_permissions IS 
'Returns all permissions for a user, including inherited ones from parent roles';


-- =============================================
-- STEP 7: Create indexes for performance
-- =============================================

CREATE INDEX IF NOT EXISTS idx_roles_parent_role_id ON roles(parent_role_id);
CREATE INDEX IF NOT EXISTS idx_roles_level ON roles(level);

-- =============================================
-- STEP 8: Verification queries
-- =============================================

DO $$
DECLARE
  v_total_roles integer;
  v_roles_with_hierarchy integer;
  v_users_migrated integer;
  v_perms_migrated integer;
BEGIN
  SELECT COUNT(*) INTO v_total_roles FROM roles;
  SELECT COUNT(*) INTO v_roles_with_hierarchy FROM roles WHERE parent_role_id IS NOT NULL;
  SELECT COUNT(*) INTO v_users_migrated FROM user_roles WHERE role_id IS NOT NULL;
  SELECT COUNT(*) INTO v_perms_migrated FROM role_permissions WHERE role_id IS NOT NULL;
  
  RAISE NOTICE '✅ Total roles: %', v_total_roles;
  RAISE NOTICE '✅ Roles with parent: %', v_roles_with_hierarchy;
  RAISE NOTICE '✅ Users migrated to role_id: %', v_users_migrated;
  RAISE NOTICE '✅ Permissions migrated to role_id: %', v_perms_migrated;
END $$;

COMMIT;

-- =============================================
-- VERIFICATION: Test hierarchy
-- =============================================

-- Show role hierarchy
SELECT 
  r.id,
  r.name,
  r.display_name_ar,
  r.level,
  p.name as parent_role,
  r.description
FROM roles r
LEFT JOIN roles p ON p.id = r.parent_role_id
ORDER BY r.level, r.name;

COMMENT ON TABLE roles IS 'User roles with hierarchical inheritance support';
COMMENT ON COLUMN roles.parent_role_id IS 'Parent role from which this role inherits permissions';
COMMENT ON COLUMN roles.level IS 'Hierarchy level (0 = top, higher = more specific)';
