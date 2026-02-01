-- ============================================
-- سكريبت التحليل المبسط - متوافق مع Supabase
-- ============================================
-- الهدف: تحليل أساسي لقاعدة البيانات بدون افتراضات مسبقة
-- الأمان: قراءة فقط
-- المدة: 1-2 دقيقة
-- ============================================

-- القسم 1: معلومات عامة
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'تحليل قاعدة البيانات - %', NOW();
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 القسم 1: معلومات عامة';
  RAISE NOTICE '----------------------------------------';
END $$;

SELECT 
  'حجم قاعدة البيانات' as metric,
  pg_size_pretty(pg_database_size(current_database())) as value;

SELECT 
  'عدد الجداول' as metric,
  COUNT(*)::TEXT as value
FROM pg_tables
WHERE schemaname = 'public';

SELECT 
  'عدد الفهارس' as metric,
  COUNT(*)::TEXT as value
FROM pg_indexes
WHERE schemaname = 'public';

SELECT 
  'عدد القيود' as metric,
  COUNT(*)::TEXT as value
FROM information_schema.table_constraints
WHERE constraint_schema = 'public';

-- القسم 2: قائمة جميع الجداول
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📋 القسم 2: قائمة جميع الجداول';
  RAISE NOTICE '----------------------------------------';
END $$;

SELECT 
  pg_tables.schemaname,
  pg_tables.tablename,
  COALESCE(n_live_tup, 0) as row_count
FROM pg_tables
LEFT JOIN pg_stat_user_tables ON pg_tables.tablename = pg_stat_user_tables.relname
WHERE pg_tables.schemaname = 'public'
ORDER BY pg_tables.tablename;

-- القسم 3: أكبر 10 جداول
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📦 القسم 3: أكبر 10 جداول';
  RAISE NOTICE '----------------------------------------';
END $$;

SELECT 
  schemaname,
  relname as tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) as total_size,
  n_live_tup as row_count,
  n_dead_tup as dead_rows
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(schemaname||'.'||relname) DESC
LIMIT 10;

-- القسم 4: القيود الموجودة
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔒 القسم 4: القيود الموجودة';
  RAISE NOTICE '----------------------------------------';
END $$;

SELECT 
  constraint_type,
  COUNT(*) as count
FROM information_schema.table_constraints
WHERE constraint_schema = 'public'
GROUP BY constraint_type
ORDER BY count DESC;

-- القسم 5: Foreign Keys الموجودة
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔗 القسم 5: Foreign Keys الموجودة';
  RAISE NOTICE '----------------------------------------';
END $$;

SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- القسم 6: الفهارس
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📑 القسم 6: الفهارس';
  RAISE NOTICE '----------------------------------------';
END $$;

SELECT 
  pg_indexes.schemaname,
  pg_indexes.tablename,
  pg_indexes.indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_indexes
JOIN pg_stat_user_indexes ON 
  pg_indexes.schemaname = pg_stat_user_indexes.schemaname 
  AND pg_indexes.tablename = pg_stat_user_indexes.relname
  AND pg_indexes.indexname = pg_stat_user_indexes.indexrelname
WHERE pg_indexes.schemaname = 'public'
ORDER BY pg_indexes.tablename, pg_indexes.indexname;

-- القسم 7: RLS Status
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🛡️ القسم 7: Row Level Security';
  RAISE NOTICE '----------------------------------------';
END $$;

SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ مفعّل'
    ELSE '❌ غير مفعّل'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- القسم 8: ملخص نهائي
DO $$
DECLARE
  total_tables INTEGER;
  total_fks INTEGER;
  total_indexes INTEGER;
  tables_without_rls INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'ملخص التحليل';
  RAISE NOTICE '================================================';
  
  SELECT COUNT(*) INTO total_tables
  FROM pg_tables
  WHERE schemaname = 'public';
  
  SELECT COUNT(*) INTO total_fks
  FROM information_schema.table_constraints
  WHERE constraint_type = 'FOREIGN KEY'
    AND constraint_schema = 'public';
  
  SELECT COUNT(*) INTO total_indexes
  FROM pg_indexes
  WHERE schemaname = 'public';
  
  SELECT COUNT(*) INTO tables_without_rls
  FROM pg_tables
  WHERE schemaname = 'public'
    AND rowsecurity = FALSE;
  
  RAISE NOTICE 'إجمالي الجداول: %', total_tables;
  RAISE NOTICE 'إجمالي Foreign Keys: %', total_fks;
  RAISE NOTICE 'إجمالي الفهارس: %', total_indexes;
  RAISE NOTICE 'جداول بدون RLS: %', tables_without_rls;
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  
  IF total_fks < 10 THEN
    RAISE NOTICE '⚠️ تحذير: عدد Foreign Keys قليل جداً';
  END IF;
  
  IF tables_without_rls > 0 THEN
    RAISE NOTICE '⚠️ تحذير: يوجد % جدول بدون RLS', tables_without_rls;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ انتهى التحليل بنجاح';
  RAISE NOTICE '================================================';
END $$;
