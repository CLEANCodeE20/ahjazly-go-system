-- =============================================
-- COMPREHENSIVE TRIP SEARCH DIAGNOSTIC
-- فحص شامل ودقيق لمشاكل البحث عن الرحلات
-- =============================================

-- 1. فحص أسماء المدن ومحطات التوقف (هل تتطابق مع ما تبحث عنه؟)
SELECT '1. Cities & Stops' as check;
SELECT DISTINCT stop_name, public.normalize_arabic(stop_name) as normalized 
FROM public.route_stops 
ORDER BY stop_name;

-- 2. فحص المسارات (Routes)
-- هل يوجد مسار يربط بين مدينتين؟
SELECT '2. Routes' as check;
SELECT route_id, origin_city, destination_city, partner_id 
FROM public.routes;

-- 3. فحص الرحلات المجدولة (Trips)
-- هل توجد رحلات مجدولة فعلياً؟ وما هي حالتها؟
SELECT '3. Scheduled Trips' as check;
SELECT 
    t.trip_id, 
    t.departure_time, 
    t.status, 
    r.origin_city, 
    r.destination_city, 
    bc.class_name
FROM public.trips t
JOIN public.routes r ON t.route_id = r.route_id
JOIN public.buses b ON t.bus_id = b.bus_id
JOIN public.bus_classes bc ON b.bus_class_id = bc.bus_class_id;

-- 4. فحص الوقت (Timezone Check)
-- هل وقت قاعدة البيانات متوافق مع وقت بحثك؟
SELECT '4. Server Time' as check;
SELECT NOW() as database_now, CURRENT_DATE as database_today;

-- 5. اختبار المحاكاة (Simulation)
-- استبدل 'تعز' و 'مكة' بالقيم التي تبحث عنها
DO $$
DECLARE
    v_from TEXT := 'تعز';
    v_to TEXT := 'مكة';
    v_date DATE := CURRENT_DATE;
BEGIN
    RAISE NOTICE '--- بدء محاكاة البحث ---';
    RAISE NOTICE 'البحث من: % الئ: % بتاريخ: %', v_from, v_to, v_date;
    
    -- هل توجد محطات منطلق؟
    IF NOT EXISTS (SELECT 1 FROM public.route_stops WHERE public.normalize_arabic(stop_name) LIKE '%' || public.normalize_arabic(v_from) || '%') THEN
        RAISE NOTICE '❌ خطأ: لم يتم العثور على أي مدينة منطلق بهذا الاسم في جدول التوقفات';
    END IF;
    
    -- هل توجد محطات وصول؟
    IF NOT EXISTS (SELECT 1 FROM public.route_stops WHERE public.normalize_arabic(stop_name) LIKE '%' || public.normalize_arabic(v_to) || '%') THEN
        RAISE NOTICE '❌ خطأ: لم يتم العثور على أي مدينة وصول بهذا الاسم في جدول التوقفات';
    END IF;

    -- اختبار دالة البحث مباشرة
    RAISE NOTICE 'نظام البحث يعيد النتائج التالية:';
END $$;

-- 6. تنفيذ البحث فعلياً (رؤية المخرجات الخام)
SELECT * FROM public.search_trips('تعز', 'مكة', CURRENT_DATE, 'all');
