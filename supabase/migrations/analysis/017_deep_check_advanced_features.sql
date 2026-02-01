-- ============================================
-- فحص تفصيلي للميزات المتقدمة المنفذة
-- ============================================

-- 1. فحص محتوى جدول الصلاحيات (أول 10 سجلات)
SELECT name, module FROM permissions LIMIT 10;

-- 2. فحص وجود دالة has_permission
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'has_permission' 
AND routine_schema = 'public';

-- 3. فحص وجود تقسيمات لجدول الحجوزات
SELECT nmsp_parent.nspname AS parent_schema,
       parent.relname      AS parent_name,
       nmsp_child.nspname  AS child_schema,
       child.relname       AS child_name
FROM pg_inherits
JOIN pg_class parent            ON pg_inherits.inhparent = parent.oid
JOIN pg_class child             ON pg_inherits.inhrelid   = child.oid
JOIN pg_namespace nmsp_parent   ON parent.relnamespace    = nmsp_parent.oid
JOIN pg_namespace nmsp_child    ON child.relnamespace     = nmsp_child.oid
WHERE parent.relname = 'bookings';
