-- ============================================
-- فحص وجود جداول RBAC وتقسيم الجداول
-- ============================================

SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('permissions', 'role_permissions', 'bookings_partitioned');
