-- ============================================
-- فحص هيكل جدول ربط الصلاحيات (role_permissions)
-- ============================================

SELECT 
    column_name, 
    data_type
FROM information_schema.columns 
WHERE table_name = 'role_permissions';
