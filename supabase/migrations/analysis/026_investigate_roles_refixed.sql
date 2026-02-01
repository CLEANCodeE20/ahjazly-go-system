-- ============================================
-- فحص قيم Enum والأدوار الممنوحة للمستخدمين حالياً
-- ============================================

-- 1. المحاولة مرة أخرى لفحص قيم Enum المتاحة (بدون الاعتماد على جدول roles)
SELECT enumlabel 
FROM pg_enum 
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
WHERE pg_type.typname = 'app_role';

-- 2. ما هي مسميات الأدوار المخزنة فعلياً مع المستخدمين الآن؟
SELECT role, count(*) 
FROM user_roles 
GROUP BY role;
