-- ============================================
-- سكريبت الملخص السريع
-- ============================================
-- الهدف: الحصول على المعلومات الأساسية فقط
-- المدة: 10 ثوانٍ
-- ============================================

-- معلومات أساسية
SELECT 
  'حجم قاعدة البيانات' as metric,
  pg_size_pretty(pg_database_size(current_database())) as value
UNION ALL
SELECT 
  'عدد الجداول',
  COUNT(*)::TEXT
FROM pg_tables
WHERE schemaname = 'public'
UNION ALL
SELECT 
  'عدد الفهارس',
  COUNT(*)::TEXT
FROM pg_indexes
WHERE schemaname = 'public'
UNION ALL
SELECT 
  'عدد Foreign Keys',
  COUNT(*)::TEXT
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY'
  AND constraint_schema = 'public'
UNION ALL
SELECT 
  'عدد Unique Constraints',
  COUNT(*)::TEXT
FROM information_schema.table_constraints
WHERE constraint_type = 'UNIQUE'
  AND constraint_schema = 'public'
UNION ALL
SELECT 
  'عدد Check Constraints',
  COUNT(*)::TEXT
FROM information_schema.table_constraints
WHERE constraint_type = 'CHECK'
  AND constraint_schema = 'public'
UNION ALL
SELECT 
  'جداول بدون RLS',
  COUNT(*)::TEXT
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = FALSE;

-- ملخص نهائي
DO $$
DECLARE
  db_size TEXT;
  total_tables INTEGER;
  total_fks INTEGER;
  total_indexes INTEGER;
  tables_without_rls INTEGER;
  assessment TEXT;
BEGIN
  SELECT pg_size_pretty(pg_database_size(current_database())) INTO db_size;
  
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
  
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '📊 ملخص قاعدة البيانات';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'حجم قاعدة البيانات: %', db_size;
  RAISE NOTICE 'عدد الجداول: %', total_tables;
  RAISE NOTICE 'عدد Foreign Keys: %', total_fks;
  RAISE NOTICE 'عدد الفهارس: %', total_indexes;
  RAISE NOTICE 'جداول بدون RLS: %', tables_without_rls;
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  
  -- تقييم الحالة
  IF total_fks >= 50 THEN
    assessment := '✅ ممتاز - قاعدة البيانات متكاملة';
    RAISE NOTICE '%', assessment;
    RAISE NOTICE 'التوصية: انتقل للمرحلة 2 (تحسين الأداء)';
  ELSIF total_fks >= 20 THEN
    assessment := '⚠️ جيد - تحتاج بعض التحسينات';
    RAISE NOTICE '%', assessment;
    RAISE NOTICE 'التوصية: ابدأ بالمرحلة 1 (إضافة Foreign Keys المفقودة)';
  ELSE
    assessment := '🔴 يحتاج عمل - قاعدة البيانات تحتاج تحسينات كبيرة';
    RAISE NOTICE '%', assessment;
    RAISE NOTICE 'التوصية: ابدأ بالمرحلة 0.5 (تنظيف البيانات) ثم المرحلة 1';
  END IF;
  
  RAISE NOTICE '';
  
  IF tables_without_rls > 0 THEN
    RAISE NOTICE '⚠️ تحذير: يوجد % جدول بدون RLS - يجب إصلاحها', tables_without_rls;
  END IF;
  
  IF total_indexes < total_tables * 2 THEN
    RAISE NOTICE '⚠️ تحذير: عدد الفهارس قليل - قد تحتاج المزيد لتحسين الأداء';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
END $$;
