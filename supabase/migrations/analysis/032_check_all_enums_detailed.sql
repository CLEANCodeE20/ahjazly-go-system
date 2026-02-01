-- ============================================
-- فحص أنواع الـ Enum لكلا حقلي التصنيف
-- ============================================

-- 1. فحص النوع المستخدم في user_roles (app_role كمتعرف عليه سابقاً)
SELECT enumlabel as labels_in_app_role
FROM pg_enum 
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
WHERE pg_type.typname = 'app_role';

-- 2. فحص النوع المستخدم في users.user_type
SELECT 
    t.typname as enum_name,
    e.enumlabel as labels
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
JOIN information_schema.columns c ON c.udt_name = t.typname
WHERE c.table_name = 'users' AND c.column_name = 'user_type';
