-- =============================================
-- DEBUG SEARCH FUNCTION
-- فحص دالة البحث خطوة بخطوة
-- =============================================

-- 1. تأكد من البيانات الأساسية
SELECT 'Step 1: Trip exists' as step;
SELECT trip_id, departure_time, status 
FROM public.trips 
WHERE trip_id = 2;

-- 2. تأكد من المسار
SELECT 'Step 2: Route exists' as step;
SELECT r.route_id, r.origin_city, r.destination_city
FROM public.trips t
JOIN public.routes r ON t.route_id = r.route_id
WHERE t.trip_id = 2;

-- 3. تأكد من الحافلة والفئة
SELECT 'Step 3: Bus and Class exist' as step;
SELECT b.bus_id, b.model, bc.class_name
FROM public.trips t
JOIN public.buses b ON t.bus_id = b.bus_id
JOIN public.bus_classes bc ON b.bus_class_id = bc.bus_class_id
WHERE t.trip_id = 2;

-- 4. اختبار شرط التاريخ
SELECT 'Step 4: Date condition' as step;
SELECT 
    trip_id,
    departure_time,
    DATE(departure_time) as trip_date,
    CURRENT_DATE as today,
    DATE(departure_time) = CURRENT_DATE as date_matches
FROM public.trips
WHERE trip_id = 2;

-- 5. اختبار شرط الفئة
SELECT 'Step 5: Class condition' as step;
SELECT 
    t.trip_id,
    bc.class_name,
    bc.class_name = 'VIP' as class_matches
FROM public.trips t
JOIN public.buses b ON t.bus_id = b.bus_id
JOIN public.bus_classes bc ON b.bus_class_id = bc.bus_class_id
WHERE t.trip_id = 2;

-- 6. اختبار شرط المدن (case-insensitive)
SELECT 'Step 6: City condition' as step;
SELECT 
    r.origin_city,
    r.destination_city,
    LOWER(TRIM(r.origin_city)) as origin_normalized,
    LOWER(TRIM(r.destination_city)) as dest_normalized,
    LOWER(TRIM(r.origin_city)) = LOWER(TRIM('تعز')) as origin_matches,
    LOWER(TRIM(r.destination_city)) = LOWER(TRIM('الرياض')) as dest_matches
FROM public.routes r
WHERE r.route_id = (SELECT route_id FROM public.trips WHERE trip_id = 2);

-- 7. اختبار شرط الحالة
SELECT 'Step 7: Status condition' as step;
SELECT 
    trip_id,
    status,
    status = 'scheduled' as status_matches
FROM public.trips
WHERE trip_id = 2;

-- 8. الاستعلام الكامل يدوياً (بدون الدالة)
SELECT 'Step 8: Manual query' as step;
SELECT
    t.trip_id,
    t.departure_time,
    t.arrival_time,
    t.base_price AS price_adult,
    (t.base_price - 50) AS price_child,
    r.origin_city,
    r.destination_city,
    bu.model,
    bc.class_name AS bus_class,
    p.company_name
FROM public.trips t
JOIN public.routes r ON t.route_id = r.route_id
JOIN public.buses bu ON t.bus_id = bu.bus_id
JOIN public.bus_classes bc ON bu.bus_class_id = bc.bus_class_id
JOIN public.partners p ON t.partner_id = p.partner_id
WHERE 
    DATE(t.departure_time) = CURRENT_DATE
    AND bc.class_name = 'VIP'
    AND LOWER(TRIM(r.origin_city)) = LOWER(TRIM('تعز'))
    AND LOWER(TRIM(r.destination_city)) = LOWER(TRIM('الرياض'));

-- 9. اختبار الدالة مع RAISE NOTICE
-- هذا سيظهر رسائل التشخيص من الدالة
SELECT 'Step 9: Function with debug' as step;
SELECT * FROM public.search_trips('تعز', 'الرياض', CURRENT_DATE, 'VIP');
