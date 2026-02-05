-- =============================================
-- DIAGNOSTIC SCRIPT: INTERMEDIATE STOPS
-- فحص نقاط التوقف (إب) ضمن رحلات (تعز -> مكه)
-- =============================================

-- 1. البحث عن المسارات التي تنطلق من "تعز" وتصل إلى "مكه"
SELECT 
    'Step 1: Find Taiz-Makkah Routes' as step,
    route_id, 
    origin_city, 
    destination_city
FROM public.routes 
WHERE 
    (origin_city LIKE '%تعز%' OR origin_city LIKE '%Taiz%')
    AND (destination_city LIKE '%مكه%' OR destination_city LIKE '%Makkah%');

-- 2. فحص هل يوجد نقطة توقف باسم "إب" لهذه المسارات
SELECT 
    'Step 2: Check for Ibb Stop' as step,
    rs.route_id,
    rs.stop_name,
    rs.stop_order,
    r.origin_city,
    r.destination_city
FROM public.route_stops rs
JOIN public.routes r ON rs.route_id = r.route_id
WHERE 
    (r.origin_city LIKE '%تعز%' OR r.origin_city LIKE '%Taiz%')
    AND (r.destination_city LIKE '%مكه%' OR r.destination_city LIKE '%Makkah%')
    AND (rs.stop_name LIKE '%إب%' OR rs.stop_name LIKE '%اب%');

-- 3. البحث عن رحلات مجدولة لهذا المسار في التاريخ المحدد
SELECT 
    'Step 3: Scheduled Trips for Route' as step,
    t.trip_id,
    t.departure_time,
    t.status,
    r.origin_city,
    r.destination_city
FROM public.trips t
JOIN public.routes r ON t.route_id = r.route_id
WHERE 
    (r.origin_city LIKE '%تعز%' OR r.origin_city LIKE '%Taiz%')
    AND (r.destination_city LIKE '%مكه%' OR r.destination_city LIKE '%Makkah%')
    AND DATE(t.departure_time) = '2026-01-23';
