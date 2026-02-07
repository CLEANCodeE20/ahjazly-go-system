-- =============================================
-- FINAL VERIFICATION - التحقق النهائي
-- =============================================

-- 1. التحقق من أن الحافلات الآن مرتبطة بفئات
SELECT 
    'Buses with Classes NOW:' as check,
    b.bus_id,
    b.model,
    b.bus_type,
    b.bus_class_id,
    bc.class_name
FROM public.buses b
LEFT JOIN public.bus_classes bc ON b.bus_class_id = bc.bus_class_id
ORDER BY b.bus_id;

-- 2. التحقق من الرحلات مع جميع التفاصيل
SELECT 
    'Trips Full Details:' as check,
    t.trip_id,
    DATE(t.departure_time) as trip_date,
    r.origin_city,
    r.destination_city,
    bc.class_name,
    t.status
FROM public.trips t
LEFT JOIN public.routes r ON t.route_id = r.route_id
LEFT JOIN public.buses b ON t.bus_id = b.bus_id
LEFT JOIN public.bus_classes bc ON b.bus_class_id = bc.bus_class_id
WHERE DATE(t.departure_time) = CURRENT_DATE
ORDER BY t.trip_id;

-- 3. ما هي أسماء المدن الفعلية في المسارات؟
SELECT DISTINCT
    'Actual Route Cities:' as check,
    origin_city,
    destination_city
FROM public.routes;

-- 4. ما هي أسماء الفئات المتاحة؟
SELECT 
    'Available Classes:' as check,
    class_name
FROM public.bus_classes;

-- 5. اختبار البحث بالمعاملات الفعلية
-- استخدم أسماء المدن والفئات من النتائج أعلاه

-- مثال: إذا كانت المدن بالعربية
SELECT 'Test 1: Arabic Cities + VIP' as test;
SELECT * FROM public.search_trips(
    'صنعاء',
    'عدن',
    CURRENT_DATE,
    'VIP'
);

-- مثال: إذا كانت المدن بالإنجليزية
SELECT 'Test 2: English Cities + Standard' as test;
SELECT * FROM public.search_trips(
    'Sanaa',
    'Aden',
    CURRENT_DATE,
    'Standard'
);

-- 6. اختبار بدون تحديد المدينة (للتأكد من وجود بيانات)
SELECT 
    'All trips for today:' as info,
    COUNT(*) as count
FROM public.trips
WHERE DATE(departure_time) = CURRENT_DATE;
