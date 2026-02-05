-- =============================================
-- VERIFY EXISTING STANDARD TRIPS
-- هذا السكريبت يفحص البيانات الموجودة فقط دون إضافة أي بيانات تجريبية
-- =============================================

-- 1. فحص مسميات الفئات المسجلة فعلياً في قاعدة البيانات
SELECT '1. Actual Bus Classes in DB' as info;
SELECT bus_class_id, class_name FROM public.bus_classes;

-- 2. البحث عن أي رحلة "Standard" موجودة في أي تاريخ
SELECT '2. Any Standard Trips (Any Date)' as info;
SELECT 
    t.trip_id, 
    t.departure_time, 
    bc.class_name,
    r.origin_city,
    r.destination_city,
    t.status
FROM public.trips t
JOIN public.buses b ON t.bus_id = b.bus_id
JOIN public.bus_classes bc ON b.bus_class_id = bc.bus_class_id
JOIN public.routes r ON t.route_id = r.route_id
WHERE bc.class_name ILIKE '%Standard%' OR bc.class_name = 'عادي';

-- 3. اختبار وظيفة البحث بنفس الطريقة التي يستدعيها التطبيق
-- استبدل القيم أدناه بالقيم التي تستخدمها في التطبيق (المدن والتاريخ)
SELECT '3. Testing RPC with App Parameters' as info;
SELECT * FROM public.search_trips(
    'صنعاء',      -- مدينة المغادرة (تأكد من مطابقتها تماماً لما في التطبيق)
    'عدن',        -- مدينة الوصول
    '2026-01-21', -- التاريخ الذي تبحث عنه (YYYY-MM-DD)
    'Standard'    -- الفئة التي يرسلها التطبيق عند اختيار "عادي"
);

-- 4. فحص المقاعد للرحلات التي لم تظهر في البحث
-- إذا كانت النتيجة 0، فهذا هو سبب الاختفاء
SELECT '4. Seat Availability Check' as info;
SELECT 
    t.trip_id,
    bc.class_name,
    (SELECT COUNT(*) FROM public.seats s WHERE s.bus_id = t.bus_id AND s.is_available = true) as available_seats_count
FROM public.trips t
JOIN public.buses b ON t.bus_id = b.bus_id
JOIN public.bus_classes bc ON b.bus_class_id = bc.bus_class_id
WHERE bc.class_name ILIKE '%Standard%';
