-- ============================================
-- الفحص النهائي بعد الترقية الشاملة
-- ============================================

-- 1. فحص توزيع أنواع المستخدمين في الجدول الرئيسي
SELECT user_type::text, count(*) 
FROM public.users 
GROUP BY 1;

-- 2. فحص توزيع الأدوار في نظام الصلاحيات
SELECT role::text, count(*) 
FROM user_roles 
GROUP BY 1;

-- 3. التأكد من ربط الصلاحيات بالأدوار الجديدة
SELECT role, count(permission_code) as permissions_count
FROM role_permissions
GROUP BY role;

-- 4. فحص عينة للتأكد من المسميات الجديدة (SUPERUSER)
SELECT full_name, user_type::text as type, role::text as role
FROM public.users u
LEFT JOIN user_roles ur ON u.auth_id = ur.user_id
WHERE user_type::text = 'SUPERUSER'
LIMIT 5;
