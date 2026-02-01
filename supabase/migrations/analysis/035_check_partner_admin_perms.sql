-- ============================================
-- فحص صلاحيات مدير الشركة (PARTNER_ADMIN)
-- ============================================

-- 1. عرض كافة التصنيفات (Categories) المتوفرة في النظام
SELECT DISTINCT category FROM permissions;

-- 2. عرض الصلاحيات الممنوحة حالياً لمدير الشركة
SELECT p.permission_code, p.category, p.description
FROM permissions p
JOIN role_permissions rp ON p.permission_code = rp.permission_code
WHERE rp.role = 'PARTNER_ADMIN'
ORDER BY p.category;
