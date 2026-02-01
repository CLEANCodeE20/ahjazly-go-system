-- ============================================
-- فحص نظام هوية المستخدم (Dual Identity System)
-- ============================================

-- 1. فحص هيكل جدول public.users والمفتاح الأجنبي
SELECT 
  c.column_name, 
  c.data_type,
  tc.constraint_name as fk_constraint,
  ccu.table_schema as foreign_schema,
  ccu.table_name as foreign_table
FROM information_schema.columns c
LEFT JOIN information_schema.key_column_usage kcu 
  ON c.table_name = kcu.table_name AND c.column_name = kcu.column_name
LEFT JOIN information_schema.table_constraints tc 
  ON kcu.constraint_name = tc.constraint_name AND tc.constraint_type = 'FOREIGN KEY'
LEFT JOIN information_schema.constraint_column_usage ccu 
  ON tc.constraint_name = ccu.constraint_name
WHERE c.table_name = 'users' AND c.table_schema = 'public';

-- 2. البحث عن دالة المزامنة (Trigger Function)
SELECT 
  routine_name, 
  routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- 3. فحص عدد المستخدمين في public.users (للمقارنة الذهنية)
SELECT COUNT(*) as public_users_count FROM public.users;
