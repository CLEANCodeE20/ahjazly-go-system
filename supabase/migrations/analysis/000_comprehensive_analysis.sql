-- ============================================
-- المرحلة 0: سكريبت التحليل الشامل لقاعدة البيانات
-- ============================================
-- الهدف: تحليل الوضع الحالي بدون أي تعديلات
-- الأمان: قراءة فقط - لا يُجري أي تغييرات
-- المدة المتوقعة: 2-5 دقائق
-- متوافق مع: Supabase SQL Editor
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'بدء التحليل الشامل لقاعدة البيانات';
  RAISE NOTICE 'التاريخ: %', NOW();
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
END $$;

-- ============================================
-- القسم 1: معلومات عامة عن قاعدة البيانات
-- ============================================
DO $$
BEGIN
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


-- ============================================
-- القسم 2: أكبر 10 جداول
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📦 القسم 2: أكبر 10 جداول';
  RAISE NOTICE '----------------------------------------';
END $$;

SELECT 
  schemaname,
  relname as tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) as total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||relname)) as table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname) - 
                 pg_relation_size(schemaname||'.'||relname)) as indexes_size,
  n_live_tup as row_count,
  n_dead_tup as dead_rows
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(schemaname||'.'||relname) DESC
LIMIT 10;


-- ============================================
-- القسم 3: فحص البيانات اليتيمة
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔍 القسم 3: فحص البيانات اليتيمة';
  RAISE NOTICE '----------------------------------------';
END $$;

-- 3.1 الركاب اليتامى (بدون حجوزات)
SELECT 
  'ركاب يتامى (بدون حجوزات)' as issue,
  COUNT(*) as count,
  'CRITICAL' as severity
FROM passengers p
LEFT JOIN bookings b ON p.booking_id = b.booking_id
WHERE b.booking_id IS NULL;

-- 3.2 الحجوزات اليتيمة (بدون مستخدمين)
SELECT 
  'حجوزات يتيمة (بدون مستخدمين)' as issue,
  COUNT(*) as count,
  'CRITICAL' as severity
FROM bookings b
LEFT JOIN users u ON b.user_id = u.user_id
WHERE u.user_id IS NULL;

-- 3.3 الحجوزات اليتيمة (بدون رحلات)
SELECT 
  'حجوزات يتيمة (بدون رحلات)' as issue,
  COUNT(*) as count,
  'CRITICAL' as severity
FROM bookings b
LEFT JOIN trips t ON b.trip_id = t.trip_id
WHERE t.trip_id IS NULL;

-- 3.4 الرحلات اليتيمة (بدون مسارات)
SELECT 
  'رحلات يتيمة (بدون مسارات)' as issue,
  COUNT(*) as count,
  'HIGH' as severity
FROM trips t
LEFT JOIN routes r ON t.route_id = r.route_id
WHERE r.route_id IS NULL;

-- 3.5 الرحلات اليتيمة (بدون حافلات)
SELECT 
  'رحلات يتيمة (بدون حافلات)' as issue,
  COUNT(*) as count,
  'HIGH' as severity
FROM trips t
LEFT JOIN buses b ON t.bus_id = b.bus_id
WHERE t.bus_id IS NOT NULL AND b.bus_id IS NULL;

-- 3.6 السائقون اليتامى (بدون شركاء)
SELECT 
  'سائقون يتامى (بدون شركاء)' as issue,
  COUNT(*) as count,
  'MEDIUM' as severity
FROM drivers d
LEFT JOIN partners p ON d.partner_id = p.partner_id
WHERE d.partner_id IS NOT NULL AND p.partner_id IS NULL;

-- 3.7 الحافلات اليتيمة (بدون شركاء)
SELECT 
  'حافلات يتيمة (بدون شركاء)' as issue,
  COUNT(*) as count,
  'MEDIUM' as severity
FROM buses b
LEFT JOIN partners p ON b.partner_id = p.partner_id
WHERE b.partner_id IS NOT NULL AND p.partner_id IS NULL;

-- 3.8 المقاعد اليتيمة (بدون حافلات)
SELECT 
  'مقاعد يتيمة (بدون حافلات)' as issue,
  COUNT(*) as count,
  'MEDIUM' as severity
FROM seats s
LEFT JOIN buses b ON s.bus_id = b.bus_id
WHERE s.bus_id IS NOT NULL AND b.bus_id IS NULL;

-- 3.9 المدفوعات اليتيمة (بدون حجوزات)
SELECT 
  'مدفوعات يتيمة (بدون حجوزات)' as issue,
  COUNT(*) as count,
  'CRITICAL' as severity
FROM payment_transactions pt
LEFT JOIN bookings b ON pt.booking_id = b.booking_id
WHERE pt.booking_id IS NOT NULL AND b.booking_id IS NULL;

-- 3.10 العمولات اليتيمة (بدون حجوزات)
SELECT 
  'عمولات يتيمة (بدون حجوزات)' as issue,
  COUNT(*) as count,
  'HIGH' as severity
FROM commissions c
LEFT JOIN bookings b ON c.booking_id = b.booking_id
WHERE c.booking_id IS NOT NULL AND b.booking_id IS NULL;


-- ============================================
-- القسم 4: فحص التكرارات
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔄 القسم 4: فحص التكرارات';
  RAISE NOTICE '----------------------------------------';
END $$;

-- 4.1 رخص سائقين مكررة
SELECT 
  'رخص سائقين مكررة' as issue,
  COUNT(*) as duplicate_groups,
  SUM(duplicate_count - 1) as total_duplicates
FROM (
  SELECT license_number, COUNT(*) as duplicate_count
  FROM drivers
  WHERE license_number IS NOT NULL
  GROUP BY license_number
  HAVING COUNT(*) > 1
) x;

-- 4.2 لوحات حافلات مكررة
SELECT 
  'لوحات حافلات مكررة' as issue,
  COUNT(*) as duplicate_groups,
  SUM(duplicate_count - 1) as total_duplicates
FROM (
  SELECT license_plate, COUNT(*) as duplicate_count
  FROM buses
  WHERE license_plate IS NOT NULL
  GROUP BY license_plate
  HAVING COUNT(*) > 1
) x;

-- 4.3 مقاعد مكررة لنفس الحافلة
SELECT 
  'مقاعد مكررة لنفس الحافلة' as issue,
  COUNT(*) as duplicate_groups,
  SUM(duplicate_count - 1) as total_duplicates
FROM (
  SELECT bus_id, seat_number, COUNT(*) as duplicate_count
  FROM seats
  GROUP BY bus_id, seat_number
  HAVING COUNT(*) > 1
) x;

-- 4.4 أرقام فواتير مكررة
SELECT 
  'أرقام فواتير مكررة' as issue,
  COUNT(*) as duplicate_groups,
  SUM(duplicate_count - 1) as total_duplicates
FROM (
  SELECT invoice_number, COUNT(*) as duplicate_count
  FROM partner_invoices
  WHERE invoice_number IS NOT NULL
  GROUP BY invoice_number
  HAVING COUNT(*) > 1
) x;

-- 4.5 مستخدمين بنفس auth_id
SELECT 
  'مستخدمين بنفس auth_id' as issue,
  COUNT(*) as duplicate_groups,
  SUM(duplicate_count - 1) as total_duplicates
FROM (
  SELECT auth_id, COUNT(*) as duplicate_count
  FROM users
  WHERE auth_id IS NOT NULL
  GROUP BY auth_id
  HAVING COUNT(*) > 1
) x;


-- ============================================
-- القسم 5: فحص القيم غير الصالحة
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ القسم 5: فحص القيم غير الصالحة';
  RAISE NOTICE '----------------------------------------';
END $$;

-- 5.1 أسعار سالبة أو صفر
SELECT 
  'أسعار حجوزات سالبة أو صفر' as issue,
  COUNT(*) as count
FROM bookings
WHERE total_price <= 0;

-- 5.2 أوقات رحلات غير منطقية
SELECT 
  'أوقات رحلات غير منطقية' as issue,
  COUNT(*) as count
FROM trips
WHERE arrival_time <= departure_time;

-- 5.3 سعة حافلات غير منطقية
SELECT 
  'سعة حافلات غير منطقية' as issue,
  COUNT(*) as count
FROM buses
WHERE capacity <= 0 OR capacity > 100;

-- 5.4 تقييمات خارج النطاق
SELECT 
  'تقييمات خارج النطاق (1-5)' as issue,
  COUNT(*) as count
FROM ratings
WHERE stars < 1 OR stars > 5;

-- 5.5 نسب استرداد غير صالحة
SELECT 
  'نسب استرداد غير صالحة' as issue,
  COUNT(*) as count
FROM cancel_policies
WHERE refund_percentage < 0 OR refund_percentage > 100;

-- 5.6 نسب عمولة غير صالحة
SELECT 
  'نسب عمولة غير صالحة' as issue,
  COUNT(*) as count
FROM partners
WHERE commission_percentage < 0 OR commission_percentage > 100;


-- ============================================
-- القسم 6: فحص القيود الموجودة
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔒 القسم 6: فحص القيود الموجودة';
  RAISE NOTICE '----------------------------------------';
END $$;

-- 6.1 عدد Foreign Keys
SELECT 
  'Foreign Keys' as constraint_type,
  COUNT(*) as count
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY'
  AND constraint_schema = 'public';

-- 6.2 عدد Unique Constraints
SELECT 
  'Unique Constraints' as constraint_type,
  COUNT(*) as count
FROM information_schema.table_constraints
WHERE constraint_type = 'UNIQUE'
  AND constraint_schema = 'public';

-- 6.3 عدد Check Constraints
SELECT 
  'Check Constraints' as constraint_type,
  COUNT(*) as count
FROM information_schema.table_constraints
WHERE constraint_type = 'CHECK'
  AND constraint_schema = 'public';

-- 6.4 عدد Primary Keys
SELECT 
  'Primary Keys' as constraint_type,
  COUNT(*) as count
FROM information_schema.table_constraints
WHERE constraint_type = 'PRIMARY KEY'
  AND constraint_schema = 'public';


-- ============================================
-- القسم 7: فحص الفهارس
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📑 القسم 7: فحص الفهارس';
  RAISE NOTICE '----------------------------------------';
END $$;

SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as times_used,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan < 100  -- فهارس غير مستخدمة كثيراً
  AND indexname NOT LIKE '%_pkey'  -- استثناء Primary Keys
ORDER BY idx_scan ASC
LIMIT 10;


-- ============================================
-- القسم 8: فحص RLS
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🛡️ القسم 8: فحص Row Level Security';
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
  AND tablename IN (
    'bookings', 'passengers', 'payment_transactions',
    'trips', 'buses', 'drivers', 'users', 'refunds',
    'notifications', 'conversations', 'messages'
  )
ORDER BY tablename;


-- ============================================
-- القسم 9: ملخص التحليل
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📊 القسم 9: ملخص التحليل';
  RAISE NOTICE '----------------------------------------';
END $$;

DO $$
DECLARE
  orphan_total INTEGER := 0;
  duplicate_total INTEGER := 0;
  invalid_total INTEGER := 0;
  fk_count INTEGER := 0;
  rls_missing INTEGER := 0;
BEGIN
  -- حساب إجمالي البيانات اليتيمة
  SELECT 
    COALESCE(SUM(cnt), 0) INTO orphan_total
  FROM (
    SELECT COUNT(*) as cnt FROM passengers p LEFT JOIN bookings b ON p.booking_id = b.booking_id WHERE b.booking_id IS NULL
    UNION ALL
    SELECT COUNT(*) FROM bookings b LEFT JOIN users u ON b.user_id = u.user_id WHERE u.user_id IS NULL
    UNION ALL
    SELECT COUNT(*) FROM bookings b LEFT JOIN trips t ON b.trip_id = t.trip_id WHERE t.trip_id IS NULL
  ) x;
  
  -- حساب إجمالي التكرارات
  SELECT 
    COALESCE(SUM(duplicate_count - 1), 0) INTO duplicate_total
  FROM (
    SELECT COUNT(*) as duplicate_count FROM drivers WHERE license_number IS NOT NULL GROUP BY license_number HAVING COUNT(*) > 1
    UNION ALL
    SELECT COUNT(*) FROM buses WHERE license_plate IS NOT NULL GROUP BY license_plate HAVING COUNT(*) > 1
  ) x;
  
  -- حساب إجمالي القيم غير الصالحة
  SELECT 
    COALESCE(SUM(cnt), 0) INTO invalid_total
  FROM (
    SELECT COUNT(*) as cnt FROM bookings WHERE total_price <= 0
    UNION ALL
    SELECT COUNT(*) FROM trips WHERE arrival_time <= departure_time
    UNION ALL
    SELECT COUNT(*) FROM buses WHERE capacity <= 0 OR capacity > 100
  ) x;
  
  -- عدد Foreign Keys
  SELECT COUNT(*) INTO fk_count
  FROM information_schema.table_constraints
  WHERE constraint_type = 'FOREIGN KEY' AND constraint_schema = 'public';
  
  -- عدد الجداول بدون RLS
  SELECT COUNT(*) INTO rls_missing
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename IN ('bookings', 'passengers', 'payment_transactions', 'trips', 'buses', 'drivers', 'users', 'refunds')
    AND rowsecurity = FALSE;
  
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'ملخص التحليل النهائي';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'إجمالي البيانات اليتيمة: %', orphan_total;
  RAISE NOTICE 'إجمالي التكرارات: %', duplicate_total;
  RAISE NOTICE 'إجمالي القيم غير الصالحة: %', invalid_total;
  RAISE NOTICE 'عدد Foreign Keys الموجودة: %', fk_count;
  RAISE NOTICE 'جداول بدون RLS: %', rls_missing;
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  
  IF orphan_total > 0 THEN
    RAISE NOTICE '⚠️ تحذير: يوجد % سجل يتيم يحتاج تنظيف', orphan_total;
  END IF;
  
  IF duplicate_total > 0 THEN
    RAISE NOTICE '⚠️ تحذير: يوجد % تكرار يحتاج حل', duplicate_total;
  END IF;
  
  IF invalid_total > 0 THEN
    RAISE NOTICE '⚠️ تحذير: يوجد % قيمة غير صالحة تحتاج إصلاح', invalid_total;
  END IF;
  
  IF fk_count < 30 THEN
    RAISE NOTICE '⚠️ تحذير: عدد Foreign Keys قليل جداً (متوقع 50+)';
  END IF;
  
  IF rls_missing > 0 THEN
    RAISE NOTICE '⚠️ تحذير: يوجد % جدول بدون RLS', rls_missing;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ انتهى التحليل بنجاح';
  RAISE NOTICE 'التاريخ: %', NOW();
  RAISE NOTICE '================================================';
END $$;
