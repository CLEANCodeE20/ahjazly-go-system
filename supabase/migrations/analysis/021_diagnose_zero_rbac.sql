-- ============================================
-- فحص الفرق بين وجود المستخدمين وبين تفعيل الصلاحيات
-- ============================================

-- 1. رؤية الأدوار الحالية للمستخدمين (إثبات وجودهم)
SELECT role, count(*) as users_count 
FROM user_roles 
GROUP BY role;

-- 2. رؤية إذا كان هناك أي تعريف للصلاحيات للأدوار
SELECT role, count(*) as permissions_defined_count 
FROM role_permissions 
GROUP BY role;

-- 3. رؤية إذا كان هناك أي صلاحيات مدخلة أصلاً
SELECT count(*) as total_permissions_defined 
FROM permissions;
