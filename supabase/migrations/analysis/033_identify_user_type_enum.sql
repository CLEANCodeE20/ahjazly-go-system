-- ============================================
-- فحص شامل لأنواع الـ Enum في الجداول
-- ============================================

-- 1. ما هو اسم النوع البرمجي (Enum) لعمود user_type؟
SELECT 
    c.column_name, 
    c.udt_name,
    t.typname as enum_name
FROM information_schema.columns c
JOIN pg_type t ON c.udt_name = t.typname
WHERE c.table_name = 'users' AND c.column_name = 'user_type';

-- 2. عرض كافة القيم المسجلة في هذا النوع
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (
    SELECT oid FROM pg_type WHERE typname = (
        SELECT udt_name FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'user_type'
    )
);
