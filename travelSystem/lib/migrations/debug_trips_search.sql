-- =============================================
-- DIAGNOSTIC SCRIPT FOR TRIPS SEARCH
-- قم بتشغيل هذا السكريبت في Supabase SQL Editor
-- =============================================

-- 1. فحص فئات الحافلات المتاحة
SELECT '1. Bus Classes' as step;
SELECT bus_class_id, class_name FROM public.bus_classes;

-- 2. فحص الرحلات المجدولة اليوم ومستقبلاً
SELECT '2. Scheduled Trips' as step;
SELECT 
    t.trip_id, 
    t.departure_time, 
    t.status, 
    bc.class_name,
    r.origin_city,
    r.destination_city
FROM public.trips t
JOIN public.buses b ON t.bus_id = b.bus_id
JOIN public.bus_classes bc ON b.bus_class_id = bc.bus_class_id
JOIN public.routes r ON t.route_id = r.route_id
WHERE t.departure_time >= CURRENT_DATE
ORDER BY t.departure_time ASC;

-- 3. اختبار وظيفة البحث مباشرة (تأكد من تغيير المدن والتاريخ لما تبحث عنه في التطبيق)
SELECT '3. Testing search_trips function' as step;
-- ملاحظة: استبدل 'صنعاء' و 'عدن' بالمدن التي تجربها، وتأكد من التاريخ
SELECT * FROM public.search_trips(
    'صنعاء', -- مدينة المغادرة
    'عدن',   -- مدينة الوصول
    CURRENT_DATE, -- التاريخ (أو تاريخ محدد مثل '2026-01-21')
    '' -- اتركها فارغة للبحث عن كل الفئات
);

-- 4. فحص المقاعد المتاحة (إذا كان العدد 0 لن تظهر الرحلة)
SELECT '4. Available Seats Check' as step;
SELECT 
    t.trip_id,
    (SELECT COUNT(*) FROM public.seats s WHERE s.bus_id = t.bus_id AND s.is_available = true) as total_seats,
    (SELECT COUNT(*) FROM public.passengers p WHERE p.trip_id = t.trip_id AND p.passenger_status = 'active') as booked_seats
FROM public.trips t
LIMIT 5;

-- 5. فحص سياسات الأمان (RLS)
-- إذا لم تظهر نتائج في التطبيق وظهرت هنا، فالمشكلة في RLS
SELECT '5. RLS Check' as step;
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('trips', 'routes', 'buses', 'bus_classes');
