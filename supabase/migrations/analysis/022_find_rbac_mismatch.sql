-- ============================================
-- فحص الحلقة المفقودة في الصلاحيات
-- ============================================

-- 1. ما هي الأدوار المعرفة في جدول الصلاحيات؟
SELECT DISTINCT role FROM role_permissions;

-- 2. ما هي الأدوار الفعلية للمستخدمين حالياً؟
SELECT DISTINCT role FROM user_roles;

-- 3. عينة من الربط الموجود للتأكد من المسميات
SELECT role, permission_code 
FROM role_permissions 
LIMIT 10;
