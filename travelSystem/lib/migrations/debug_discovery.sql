-- =============================================
-- DISCOVERY SCRIPT (Fixed)
-- سكريبت استكشافي لمعرفة البيانات الموجودة فعلياً
-- =============================================

-- 1. عرض جميع المدن التي تبدأ بحرف "إ" أو "ا"
SELECT DISTINCT origin_city 
FROM public.routes 
WHERE origin_city LIKE 'ا%' OR origin_city LIKE 'إ%' OR origin_city LIKE 'أ%';

-- 2. عرض جميع الوجهات المتاحة من "إب" (أو ما يشبهها)
SELECT route_id, origin_city, destination_city 
FROM public.routes 
WHERE origin_city LIKE '%إب%' OR origin_city LIKE '%اب%';

-- 3. عرض جميع الرحلات في تاريخ 2026-01-23
SELECT t.trip_id, r.origin_city, r.destination_city, t.departure_time, t.status
FROM public.trips t
JOIN public.routes r ON t.route_id = r.route_id
WHERE DATE(t.departure_time) = '2026-01-23';

-- 4. عرض جميع الرحلات من "إب" في أي تاريخ
SELECT t.trip_id, r.origin_city, r.destination_city, t.departure_time, t.status
FROM public.trips t
JOIN public.routes r ON t.route_id = r.route_id
WHERE r.origin_city LIKE '%إب%' OR r.origin_city LIKE '%اب%'
LIMIT 10;
