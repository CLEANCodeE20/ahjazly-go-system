-- ============================================
-- فحص البيانات الفعلية لنظام الصلاحيات (النسخة المصححة)
-- ============================================

-- 1. عرض عينة من مسميات الصلاحيات الموجودة
SELECT permission_code, description, category 
FROM permissions 
LIMIT 15;

-- 2. فحص توزيع الصلاحيات على الأدوار والشركاء
SELECT role, count(permission_code) as permissions_count, partner_id
FROM role_permissions
GROUP BY role, partner_id
ORDER BY permissions_count DESC;

-- 3. فحص إذا كان هناك صلاحيات مرتبطة بمستخدمين فعليين
SELECT count(distinct ur.user_id) as active_users_with_rbac
FROM user_roles ur
JOIN role_permissions rp ON ur.role::text = rp.role::text
WHERE rp.permission_code IS NOT NULL;
