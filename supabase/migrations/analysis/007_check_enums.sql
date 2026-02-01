-- ============================================
-- فحص قيم Enum app_role
-- ============================================

SELECT e.enumlabel
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'app_role';
