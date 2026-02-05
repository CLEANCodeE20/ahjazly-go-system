-- =============================================
-- DIAGNOSTIC SEARCH SCRIPT V3 (Supabase Compatible)
-- سكريبت تشخيصي متوافق مع Supabase
-- =============================================

-- 1. إعداد متغيرات البحث (قم بتعديل القيم هنا فقط)
-- SETUP SEARCH PARAMETERS
DROP TABLE IF EXISTS debug_params;
CREATE TEMP TABLE debug_params AS 
SELECT 
    'إب'::text as p_from,      -- مدينة الانطلاق
    'مكه'::text as p_to,       -- مدينة الوصول
    '2026-01-23'::date as p_date, -- تاريخ الرحلة
    'VIP'::text as p_class;    -- فئة الرحلة

-- =============================================
-- بداية التشخيص
-- =============================================

-- 2. البحث عن أي رحلة بين المدينتين (تطابق تام)
SELECT 
    'Step 1: Exact Match Check' as step,
    t.trip_id,
    t.departure_time,
    r.origin_city,
    r.destination_city,
    t.status
FROM public.trips t
JOIN public.routes r ON t.route_id = r.route_id,
debug_params dp
WHERE 
    r.origin_city = dp.p_from 
    AND r.destination_city = dp.p_to;

-- 3. البحث مع تطابق تقريبي (لمعالجة مشاكل الهمزات والتاء المربوطة)
-- هذا يفحص هل المشكلة في كتابة الاسم (مثلاً مكة vs مكه)
SELECT 
    'Step 2: Fuzzy/Normalized Match Check' as step,
    t.trip_id,
    r.origin_city,
    r.destination_city,
    dp.p_from as search_from,
    dp.p_to as search_to
FROM public.trips t
JOIN public.routes r ON t.route_id = r.route_id,
debug_params dp
WHERE 
    -- فحص الانطلاق (مع وبدون همزات)
    (
        r.origin_city = dp.p_from 
        OR r.origin_city LIKE '%' || dp.p_from || '%'
        OR REPLACE(REPLACE(r.origin_city, 'أ', 'ا'), 'إ', 'ا') LIKE '%' || REPLACE(REPLACE(dp.p_from, 'أ', 'ا'), 'إ', 'ا') || '%'
    )
    AND 
    -- فحص الوصول (مع وبدون تاء مربوطة/هاء)
    (
        r.destination_city = dp.p_to 
        OR r.destination_city LIKE '%' || dp.p_to || '%'
        OR REPLACE(r.destination_city, 'ة', 'ه') LIKE '%' || REPLACE(dp.p_to, 'ة', 'ه') || '%'
    );

-- 4. التحقق من التاريخ (لأي رحلة وجدت في الخطوة السابقة)
SELECT 
    'Step 3: Date Check' as step,
    t.trip_id,
    t.departure_time,
    DATE(t.departure_time) as trip_date,
    dp.p_date as search_date,
    (DATE(t.departure_time) = dp.p_date) as is_date_match
FROM public.trips t
JOIN public.routes r ON t.route_id = r.route_id,
debug_params dp
WHERE 
    (r.origin_city LIKE '%' || dp.p_from || '%' OR dp.p_from LIKE '%' || r.origin_city || '%')
    AND (r.destination_city LIKE '%' || dp.p_to || '%' OR dp.p_to LIKE '%' || r.destination_city || '%');

-- 5. التحقق من فئة الباص
SELECT 
    'Step 4: Class Check' as step,
    t.trip_id,
    bc.class_name,
    dp.p_class as search_class,
    (bc.class_name = dp.p_class) as is_class_match
FROM public.trips t
JOIN public.buses b ON t.bus_id = b.bus_id
JOIN public.bus_classes bc ON b.bus_class_id = bc.bus_class_id,
debug_params dp
WHERE t.trip_id IN (
    SELECT t2.trip_id 
    FROM public.trips t2 
    JOIN public.routes r2 ON t2.route_id = r2.route_id
    WHERE (r2.origin_city LIKE '%' || dp.p_from || '%' OR dp.p_from LIKE '%' || r2.origin_city || '%')
);

-- 6. التحقق من المقاعد
SELECT 
    'Step 5: Seat Availability' as step,
    t.trip_id,
    (SELECT COUNT(*) FROM public.seats s WHERE s.bus_id = t.bus_id AND s.is_available = true) as total_seats,
    (SELECT COUNT(*) FROM public.passengers p WHERE p.trip_id = t.trip_id AND p.passenger_status = 'active') as booked_seats
FROM public.trips t
JOIN public.routes r ON t.route_id = r.route_id,
debug_params dp
WHERE 
    (r.origin_city LIKE '%' || dp.p_from || '%' OR dp.p_from LIKE '%' || r.origin_city || '%')
    AND (r.destination_city LIKE '%' || dp.p_to || '%' OR dp.p_to LIKE '%' || r.destination_city || '%')
    AND DATE(t.departure_time) = dp.p_date;

-- 7. تجربة الدالة الرسمية
SELECT 'Step 6: Official Function Result' as step;
SELECT * FROM public.search_trips(
    (SELECT p_from FROM debug_params), 
    (SELECT p_to FROM debug_params), 
    (SELECT p_date FROM debug_params), 
    (SELECT p_class FROM debug_params)
);
