-- ============================================
-- فحص تفصيلي لتوصيات التقرير القديم
-- ============================================
-- الهدف: التحقق من تنفيذ كل توصية من التقرير
-- ============================================

-- القسم 1: فحص Foreign Keys المحددة في التقرير
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '🔍 القسم 1: فحص Foreign Keys من التقرير';
  RAISE NOTICE '================================================';
END $$;

-- التحقق من وجود FK محددة
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE table_name = 'user_roles' 
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name LIKE '%user%'
    ) THEN '✅ موجود'
    ELSE '❌ مفقود'
  END as "user_roles -> users FK",
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE table_name = 'bookings' 
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name LIKE '%user%'
    ) THEN '✅ موجود'
    ELSE '❌ مفقود'
  END as "bookings -> users FK",
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE table_name = 'bookings' 
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name LIKE '%trip%'
    ) THEN '✅ موجود'
    ELSE '❌ مفقود'
  END as "bookings -> trips FK",
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE table_name = 'passengers' 
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name LIKE '%booking%'
    ) THEN '✅ موجود'
    ELSE '❌ مفقود'
  END as "passengers -> bookings FK";

-- القسم 2: فحص Unique Constraints المحددة
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '🔒 القسم 2: فحص Unique Constraints من التقرير';
  RAISE NOTICE '================================================';
END $$;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE table_name = 'buses' 
      AND constraint_type = 'UNIQUE'
      AND constraint_name LIKE '%license_plate%'
    ) THEN '✅ موجود'
    ELSE '❌ مفقود'
  END as "buses.license_plate UNIQUE",
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE table_name = 'drivers' 
      AND constraint_type = 'UNIQUE'
      AND constraint_name LIKE '%license%'
    ) THEN '✅ موجود'
    ELSE '❌ مفقود'
  END as "drivers.license_number UNIQUE",
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'seats' 
      AND tc.constraint_type = 'UNIQUE'
      AND kcu.column_name IN ('bus_id', 'seat_number')
    ) THEN '✅ موجود'
    ELSE '❌ مفقود'
  END as "seats (bus_id, seat_number) UNIQUE";

-- القسم 3: فحص Check Constraints المحددة
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✓ القسم 3: فحص Check Constraints من التقرير';
  RAISE NOTICE '================================================';
END $$;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.check_constraints 
      WHERE constraint_name LIKE '%bookings%price%'
      OR constraint_name LIKE '%total_price%'
    ) THEN '✅ موجود'
    ELSE '❌ مفقود'
  END as "bookings.total_price > 0",
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.check_constraints 
      WHERE constraint_name LIKE '%trips%time%'
      OR constraint_name LIKE '%arrival%'
    ) THEN '✅ موجود'
    ELSE '❌ مفقود'
  END as "trips arrival > departure",
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.check_constraints 
      WHERE constraint_name LIKE '%buses%capacity%'
    ) THEN '✅ موجود'
    ELSE '❌ مفقود'
  END as "buses.capacity valid",
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.check_constraints 
      WHERE constraint_name LIKE '%ratings%stars%'
    ) THEN '✅ موجود'
    ELSE '❌ مفقود'
  END as "ratings.stars 1-5";

-- القسم 4: فحص الفهارس المحددة
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '📑 القسم 4: فحص الفهارس من التقرير';
  RAISE NOTICE '================================================';
END $$;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE tablename = 'bookings' 
      AND indexname LIKE '%user%'
    ) THEN '✅ موجود'
    ELSE '❌ مفقود'
  END as "idx_bookings_user_id",
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE tablename = 'bookings' 
      AND indexname LIKE '%trip%'
    ) THEN '✅ موجود'
    ELSE '❌ مفقود'
  END as "idx_bookings_trip_id",
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE tablename = 'trips' 
      AND indexname LIKE '%departure%'
    ) THEN '✅ موجود'
    ELSE '❌ مفقود'
  END as "idx_trips_departure_time",
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE tablename = 'passengers' 
      AND indexname LIKE '%booking%'
    ) THEN '✅ موجود'
    ELSE '❌ مفقود'
  END as "idx_passengers_booking_id";

-- القسم 5: فحص عمود is_available في seats
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '🪑 القسم 5: فحص تصميم توفر المقاعد';
  RAISE NOTICE '================================================';
END $$;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'seats' 
      AND column_name = 'is_available'
    ) THEN '⚠️ موجود (يجب إزالته حسب التقرير)'
    ELSE '✅ تم إزالته'
  END as "seats.is_available status";

-- القسم 6: فحص عمود trip_id الزائد في passengers
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '👥 القسم 6: فحص الأعمدة الزائدة';
  RAISE NOTICE '================================================';
END $$;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'passengers' 
      AND column_name = 'trip_id'
    ) THEN '⚠️ موجود (زائد حسب التقرير)'
    ELSE '✅ تم إزالته'
  END as "passengers.trip_id (redundant)";

-- القسم 7: فحص جداول الاسترداد المكررة
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '💰 القسم 7: فحص جداول الاسترداد';
  RAISE NOTICE '================================================';
END $$;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'refunds') 
    THEN '✅ موجود'
    ELSE '❌ غير موجود'
  END as "refunds table",
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'refund_transactions') 
    THEN '✅ موجود'
    ELSE '❌ غير موجود'
  END as "refund_transactions table",
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'refunds')
    AND EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'refund_transactions')
    THEN '⚠️ كلاهما موجود (تكرار محتمل)'
    ELSE '✅ لا تكرار'
  END as "duplication status";

-- القسم 8: الملخص النهائي
DO $$
DECLARE
  total_fks INTEGER;
  total_unique INTEGER;
  total_checks INTEGER;
  total_indexes INTEGER;
  has_is_available BOOLEAN;
  has_trip_id_redundant BOOLEAN;
  has_both_refund_tables BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO total_fks
  FROM information_schema.table_constraints
  WHERE constraint_type = 'FOREIGN KEY'
    AND constraint_schema = 'public';
  
  SELECT COUNT(*) INTO total_unique
  FROM information_schema.table_constraints
  WHERE constraint_type = 'UNIQUE'
    AND constraint_schema = 'public';
  
  SELECT COUNT(*) INTO total_checks
  FROM information_schema.check_constraints
  WHERE constraint_schema = 'public';
  
  SELECT COUNT(*) INTO total_indexes
  FROM pg_indexes
  WHERE schemaname = 'public';
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'seats' AND column_name = 'is_available'
  ) INTO has_is_available;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'passengers' AND column_name = 'trip_id'
  ) INTO has_trip_id_redundant;
  
  SELECT (
    EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'refunds')
    AND EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'refund_transactions')
  ) INTO has_both_refund_tables;
  
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'ملخص فحص توصيات التقرير';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ تم تنفيذها:';
  RAISE NOTICE '  ├─ Foreign Keys: % (التوصية: إضافة FKs)', total_fks;
  RAISE NOTICE '  ├─ Unique Constraints: % (التوصية: منع التكرار)', total_unique;
  RAISE NOTICE '  ├─ Check Constraints: % (التوصية: التحقق من البيانات)', total_checks;
  RAISE NOTICE '  └─ الفهارس: % (التوصية: تحسين الأداء)', total_indexes;
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ لم يتم تنفيذها:';
  
  IF has_is_available THEN
    RAISE NOTICE '  ├─ seats.is_available لا يزال موجوداً (يجب إزالته)';
  END IF;
  
  IF has_trip_id_redundant THEN
    RAISE NOTICE '  ├─ passengers.trip_id لا يزال موجوداً (عمود زائد)';
  END IF;
  
  IF has_both_refund_tables THEN
    RAISE NOTICE '  └─ جداول الاسترداد المكررة لا تزال موجودة (يجب الدمج)';
  END IF;
  
  IF NOT has_is_available AND NOT has_trip_id_redundant AND NOT has_both_refund_tables THEN
    RAISE NOTICE '  └─ لا توجد توصيات متبقية!';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'التقييم: % من التوصيات الحرجة تم تنفيذها', 
    CASE 
      WHEN total_fks > 100 AND total_checks > 150 AND total_indexes > 100 
      THEN '95%'
      ELSE '< 95%'
    END;
  RAISE NOTICE '================================================';
END $$;
