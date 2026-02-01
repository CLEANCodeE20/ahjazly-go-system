-- ============================================
-- فحص عميق مبسط للحالات الحرجة
-- ============================================
-- نسخة مبسطة بدون افتراضات عن أسماء الأعمدة
-- ============================================

-- القسم 1: فحص البيانات اليتيمة
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '🔍 فحص البيانات اليتيمة';
  RAISE NOTICE '================================================';
END $$;

SELECT 
  'حجوزات بدون مستخدمين' as issue,
  COUNT(*) as count,
  'CRITICAL' as severity
FROM bookings b
LEFT JOIN users u ON b.user_id = u.user_id
WHERE u.user_id IS NULL;

SELECT 
  'حجوزات بدون رحلات' as issue,
  COUNT(*) as count,
  'CRITICAL' as severity
FROM bookings b
LEFT JOIN trips t ON b.trip_id = t.trip_id
WHERE t.trip_id IS NULL;

SELECT 
  'ركاب بدون حجوزات' as issue,
  COUNT(*) as count,
  'CRITICAL' as severity
FROM passengers p
LEFT JOIN bookings b ON p.booking_id = b.booking_id
WHERE b.booking_id IS NULL;

SELECT 
  'مدفوعات بدون حجوزات' as issue,
  COUNT(*) as count,
  'CRITICAL' as severity
FROM payment_transactions pt
LEFT JOIN bookings b ON pt.booking_id = b.booking_id
WHERE pt.booking_id IS NOT NULL AND b.booking_id IS NULL;

-- القسم 2: فحص CASCADE Behavior الخطير
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '⚠️ فحص CASCADE Behavior';
  RAISE NOTICE '================================================';
END $$;

SELECT 
  COUNT(*) as cascade_count,
  'عدد Foreign Keys بـ CASCADE DELETE' as description
FROM information_schema.referential_constraints
WHERE constraint_schema = 'public'
  AND delete_rule = 'CASCADE';

SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND rc.delete_rule = 'CASCADE'
ORDER BY tc.table_name
LIMIT 20;

-- القسم 3: فحص RLS
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '🛡️ فحص RLS';
  RAISE NOTICE '================================================';
END $$;

-- جداول بدون RLS
SELECT 
  schemaname,
  tablename,
  '❌ RLS غير مفعّل' as status
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = FALSE;

-- جداول بدون Policies
SELECT 
  t.schemaname,
  t.tablename,
  '⚠️ RLS مفعّل لكن بدون policies' as status
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND t.rowsecurity = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = t.schemaname
      AND p.tablename = t.tablename
  );

-- القسم 4: فحص القيم المالية
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '💰 فحص القيم المالية';
  RAISE NOTICE '================================================';
END $$;

SELECT 
  'حجوزات بأسعار غير صالحة' as issue,
  COUNT(*) as count,
  COALESCE(MIN(total_price), 0) as min_price,
  COALESCE(MAX(total_price), 0) as max_price
FROM bookings
WHERE total_price <= 0;

SELECT 
  'مدفوعات بمبالغ سالبة' as issue,
  COUNT(*) as count
FROM payment_transactions
WHERE amount < 0;

-- القسم 5: فحص تضارب البيانات
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '⚔️ فحص تضارب البيانات';
  RAISE NOTICE '================================================';
END $$;

-- مقاعد محجوزة مرتين
SELECT 
  'مقاعد محجوزة لأكثر من راكب' as issue,
  COUNT(*) as count
FROM (
  SELECT p.seat_id, b.trip_id, COUNT(*) as passenger_count
  FROM passengers p
  JOIN bookings b ON p.booking_id = b.booking_id
  WHERE p.seat_id IS NOT NULL
  GROUP BY p.seat_id, b.trip_id
  HAVING COUNT(*) > 1
) x;

-- رحلات بأوقات غير منطقية
SELECT 
  'رحلات بأوقات غير منطقية' as issue,
  COUNT(*) as count
FROM trips
WHERE arrival_time <= departure_time;

-- القسم 6: الملخص النهائي
DO $$
DECLARE
  orphaned_bookings INTEGER;
  orphaned_passengers INTEGER;
  orphaned_payments INTEGER;
  cascade_fks INTEGER;
  tables_without_rls INTEGER;
  tables_without_policies INTEGER;
  invalid_prices INTEGER;
  duplicate_seats INTEGER;
  invalid_times INTEGER;
  critical_issues INTEGER := 0;
  warnings INTEGER := 0;
BEGIN
  -- حساب المشاكل الحرجة
  SELECT COUNT(*) INTO orphaned_bookings
  FROM bookings b
  LEFT JOIN users u ON b.user_id = u.user_id
  WHERE u.user_id IS NULL;
  
  SELECT COUNT(*) INTO orphaned_passengers
  FROM passengers p
  LEFT JOIN bookings b ON p.booking_id = b.booking_id
  WHERE b.booking_id IS NULL;
  
  SELECT COUNT(*) INTO orphaned_payments
  FROM payment_transactions pt
  LEFT JOIN bookings b ON pt.booking_id = b.booking_id
  WHERE pt.booking_id IS NOT NULL AND b.booking_id IS NULL;
  
  SELECT COUNT(*) INTO tables_without_rls
  FROM pg_tables
  WHERE schemaname = 'public'
    AND rowsecurity = FALSE;
  
  SELECT COUNT(*) INTO invalid_prices
  FROM bookings
  WHERE total_price <= 0;
  
  SELECT COUNT(*) INTO duplicate_seats
  FROM (
    SELECT p.seat_id, b.trip_id, COUNT(*) as passenger_count
    FROM passengers p
    JOIN bookings b ON p.booking_id = b.booking_id
    WHERE p.seat_id IS NOT NULL
    GROUP BY p.seat_id, b.trip_id
    HAVING COUNT(*) > 1
  ) x;
  
  SELECT COUNT(*) INTO invalid_times
  FROM trips
  WHERE arrival_time <= departure_time;
  
  -- حساب التحذيرات
  SELECT COUNT(*) INTO cascade_fks
  FROM information_schema.referential_constraints
  WHERE constraint_schema = 'public'
    AND delete_rule = 'CASCADE';
  
  SELECT COUNT(*) INTO tables_without_policies
  FROM pg_tables t
  WHERE t.schemaname = 'public'
    AND t.rowsecurity = TRUE
    AND NOT EXISTS (
      SELECT 1 FROM pg_policies p
      WHERE p.schemaname = t.schemaname
        AND p.tablename = t.tablename
    );
  
  -- حساب الإجمالي
  critical_issues := orphaned_bookings + orphaned_passengers + orphaned_payments + 
                     invalid_prices + duplicate_seats + invalid_times;
  warnings := cascade_fks + tables_without_rls + tables_without_policies;
  
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '📊 الملخص النهائي';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  RAISE NOTICE '🔴 مشاكل حرجة (يجب إصلاحها فوراً):';
  RAISE NOTICE '  ├─ حجوزات يتيمة: %', orphaned_bookings;
  RAISE NOTICE '  ├─ ركاب يتامى: %', orphaned_passengers;
  RAISE NOTICE '  ├─ مدفوعات يتيمة: %', orphaned_payments;
  RAISE NOTICE '  ├─ حجوزات بأسعار غير صالحة: %', invalid_prices;
  RAISE NOTICE '  ├─ مقاعد محجوزة مرتين: %', duplicate_seats;
  RAISE NOTICE '  └─ رحلات بأوقات غير منطقية: %', invalid_times;
  RAISE NOTICE '  📊 الإجمالي: % مشكلة حرجة', critical_issues;
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ تحذيرات (يجب مراجعتها):';
  RAISE NOTICE '  ├─ Foreign Keys بـ CASCADE: %', cascade_fks;
  RAISE NOTICE '  ├─ جداول بدون RLS: %', tables_without_rls;
  RAISE NOTICE '  └─ جداول بدون Policies: %', tables_without_policies;
  RAISE NOTICE '  📊 الإجمالي: % تحذير', warnings;
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'التقييم النهائي:';
  RAISE NOTICE '================================================';
  
  IF critical_issues = 0 AND warnings <= 5 THEN
    RAISE NOTICE '✅ ممتاز! قاعدة البيانات سليمة';
    RAISE NOTICE 'التوصية: صيانة دورية فقط';
  ELSIF critical_issues = 0 AND warnings <= 20 THEN
    RAISE NOTICE '✅ جيد جداً! بعض التحذيرات البسيطة';
    RAISE NOTICE 'التوصية: مراجعة التحذيرات وإصلاحها';
  ELSIF critical_issues < 10 THEN
    RAISE NOTICE '⚠️ يحتاج عمل! يوجد % مشكلة حرجة', critical_issues;
    RAISE NOTICE 'التوصية: ابدأ بالمرحلة 0.5 (تنظيف البيانات)';
  ELSE
    RAISE NOTICE '🔴 حالة حرجة! يوجد % مشكلة خطيرة', critical_issues;
    RAISE NOTICE 'التوصية: توقف عن استخدام النظام وابدأ التنظيف فوراً';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
END $$;
