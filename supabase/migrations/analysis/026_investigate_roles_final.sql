-- ============================================
-- فحص أنواع الأدوار والأدوار المعرفة حالياً
-- ============================================

-- 1. فحص القيم المسموح بها في Enum
SELECT enumlabel 
FROM pg_enum 
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
WHERE pg_type.typname = 'app_role';

-- 2. فحص هيكل جدول roles الحالي
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'roles';

-- 3. عينة من البيانات الحالية في جدول roles
SELECT * FROM roles LIMIT 10;
