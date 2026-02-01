-- =============================================
-- SEED DEFAULT PERMISSIONS (Golden Presets)
-- Date: 2026-01-31
-- Purpose: Populate role_permissions with standard best-practice defaults
-- =============================================

BEGIN;

-- 1. Define Manager Defaults (Full Branch Management)
-- =============================================
INSERT INTO role_permissions (role, permission_code, role_id, partner_id)
SELECT 
    'manager', 
    p.permission_code, 
    (SELECT id FROM roles WHERE name = 'manager'), 
    NULL -- Global default (for all partners)
FROM permissions p
WHERE 
    p.resource IN ('routes', 'trips', 'bookings', 'drivers', 'buses', 'reports', 'employees')
    AND p.action IN ('read', 'write', 'create', 'update', 'delete', 'manage')
ON CONFLICT DO NOTHING;

-- 2. Define Accountant Defaults (Finance Focused)
-- =============================================
INSERT INTO role_permissions (role, permission_code, role_id, partner_id)
SELECT 
    'accountant', 
    p.permission_code, 
    (SELECT id FROM roles WHERE name = 'accountant'), 
    NULL
FROM permissions p
WHERE 
    (p.resource IN ('payments', 'refunds', 'financial_reports', 'invoices') AND p.action IN ('read', 'write', 'create', 'update', 'manage'))
    OR
    (p.resource IN ('bookings', 'reports') AND p.action = 'read') -- Read-only context
ON CONFLICT DO NOTHING;

-- 3. Define Support Defaults (Customer Service)
-- =============================================
INSERT INTO role_permissions (role, permission_code, role_id, partner_id)
SELECT 
    'support', 
    p.permission_code, 
    (SELECT id FROM roles WHERE name = 'support'), 
    NULL
FROM permissions p
WHERE 
    (p.resource IN ('bookings', 'tickets', 'customers') AND p.action IN ('read', 'write', 'update', 'manage'))
    OR
    (p.resource IN ('trips', 'routes', 'schedule') AND p.action = 'read') -- Read-only context
ON CONFLICT DO NOTHING;

-- 4. Define Driver Defaults (Operational)
-- =============================================
INSERT INTO role_permissions (role, permission_code, role_id, partner_id)
SELECT 
    'driver', 
    p.permission_code, 
    (SELECT id FROM roles WHERE name = 'driver'), 
    NULL
FROM permissions p
WHERE 
    (p.resource IN ('my_trips', 'my_schedule') AND p.action IN ('read', 'update'))
    OR
    (p.resource = 'vehicle_check' AND p.action = 'create')
ON CONFLICT DO NOTHING;

-- 5. Define Supervisor Defaults (Operational Oversight)
-- =============================================
INSERT INTO role_permissions (role, permission_code, role_id, partner_id)
SELECT 
    'supervisor', 
    p.permission_code, 
    (SELECT id FROM roles WHERE name = 'supervisor'), 
    NULL
FROM permissions p
WHERE 
    p.resource IN ('trips', 'drivers', 'buses', 'movements')
    AND p.action IN ('read', 'write', 'update', 'manage')
ON CONFLICT DO NOTHING;

-- 6. Verification
-- =============================================
DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count FROM role_permissions WHERE partner_id IS NULL;
  RAISE NOTICE '✅ Seeded % default permissions across all roles', v_count;
END $$;

COMMIT;
