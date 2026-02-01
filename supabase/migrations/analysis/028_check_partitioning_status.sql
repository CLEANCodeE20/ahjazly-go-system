-- ============================================
-- فحص حالة تقسيم الجداول (Partitioning Check)
-- ============================================

-- 1. البحث عن جداول التقسيم (بناءً على التسمية المتوقعة في الخطة)
SELECT tablename 
FROM pg_tables 
WHERE tablename LIKE '%partitioned%' 
   OR tablename LIKE 'bookings_%_202%'
   OR tablename LIKE 'notifications_%_202%';

-- 2. التحقق من وجود ميكانيكا التقسيم الأصلية في PostgreSQL
SELECT 
    nmsp_parent.nspname AS parent_schema,
    rel_parent.relname AS parent_table,
    nmsp_child.nspname AS child_schema,
    rel_child.relname AS child_table
FROM pg_inherits
JOIN pg_class rel_parent ON pg_inherits.inhparent = rel_parent.oid
JOIN pg_class rel_child ON pg_inherits.inhrelid = rel_child.oid
JOIN pg_namespace nmsp_parent ON rel_parent.relnamespace = nmsp_parent.oid
JOIN pg_namespace nmsp_child ON rel_child.relnamespace = nmsp_child.oid
WHERE rel_parent.relname = 'bookings' OR rel_parent.relname = 'notifications';

-- 3. فحص وظائف الصيانة الخاصة بالتقسيم (إذا وجدت)
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name LIKE '%partition%' OR routine_name LIKE '%maintenance%';
