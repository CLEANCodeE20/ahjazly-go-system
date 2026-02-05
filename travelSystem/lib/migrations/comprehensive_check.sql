-- =============================================
-- COMPREHENSIVE DATABASE CHECK
-- فحص شامل لقاعدة البيانات
-- =============================================

-- 1. فحص الشركاء (Partners)
SELECT 
    '1. Partners' as check_name,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE status = 'approved') as approved_count
FROM public.partners;

-- 2. فحص فئات الحافلات (Bus Classes)
SELECT 
    '2. Bus Classes' as check_name,
    bus_class_id,
    class_name,
    description
FROM public.bus_classes
ORDER BY bus_class_id;

-- 3. فحص الحافلات (Buses)
SELECT 
    '3. Buses' as check_name,
    COUNT(*) as total_buses,
    COUNT(*) FILTER (WHERE status = 'active') as active_buses
FROM public.buses;

-- 4. فحص المسارات (Routes)
SELECT 
    '4. Routes' as check_name,
    route_id,
    origin_city,
    destination_city,
    partner_id
FROM public.routes
ORDER BY route_id;

-- 5. فحص محطات المسار (Route Stops)
SELECT 
    '5. Route Stops' as check_name,
    r.route_id,
    r.origin_city || ' → ' || r.destination_city as route,
    rs.stop_name,
    rs.stop_order
FROM public.routes r
LEFT JOIN public.route_stops rs ON r.route_id = rs.route_id
ORDER BY r.route_id, rs.stop_order;

-- 6. فحص الرحلات (Trips) - معلومات مفصلة
SELECT 
    '6. Trips Details' as check_name,
    t.trip_id,
    DATE(t.departure_time) as trip_date,
    TO_CHAR(t.departure_time, 'HH24:MI') as departure_time,
    r.origin_city,
    r.destination_city,
    bc.class_name as bus_class,
    p.company_name as partner,
    t.base_price,
    t.status
FROM public.trips t
LEFT JOIN public.routes r ON t.route_id = r.route_id
LEFT JOIN public.buses b ON t.bus_id = b.bus_id
LEFT JOIN public.bus_classes bc ON b.bus_class_id = bc.bus_class_id
LEFT JOIN public.partners p ON t.partner_id = p.partner_id
ORDER BY t.departure_time DESC
LIMIT 20;

-- 7. فحص الرحلات حسب التاريخ
SELECT 
    '7. Trips by Date' as check_name,
    DATE(departure_time) as trip_date,
    COUNT(*) as trips_count
FROM public.trips
GROUP BY DATE(departure_time)
ORDER BY trip_date;

-- 8. فحص الرحلات حسب الفئة
SELECT 
    '8. Trips by Class' as check_name,
    bc.class_name,
    COUNT(*) as trips_count
FROM public.trips t
JOIN public.buses b ON t.bus_id = b.bus_id
JOIN public.bus_classes bc ON b.bus_class_id = bc.bus_class_id
GROUP BY bc.class_name;

-- 9. فحص المقاعد المتاحة
SELECT 
    '9. Available Seats' as check_name,
    b.bus_id,
    b.model,
    COUNT(*) FILTER (WHERE s.is_available = true) as available_seats,
    COUNT(*) as total_seats
FROM public.buses b
LEFT JOIN public.seats s ON b.bus_id = s.bus_id
GROUP BY b.bus_id, b.model;

-- 10. فحص شامل للرحلات مع جميع العلاقات
SELECT 
    '10. Full Trip Check' as info,
    t.trip_id,
    CASE 
        WHEN r.route_id IS NULL THEN '❌ Missing Route'
        ELSE '✓ Route: ' || r.origin_city || ' → ' || r.destination_city
    END as route_status,
    CASE 
        WHEN b.bus_id IS NULL THEN '❌ Missing Bus'
        ELSE '✓ Bus: ' || b.model
    END as bus_status,
    CASE 
        WHEN bc.bus_class_id IS NULL THEN '❌ Missing Bus Class'
        ELSE '✓ Class: ' || bc.class_name
    END as class_status,
    CASE 
        WHEN p.partner_id IS NULL THEN '❌ Missing Partner'
        ELSE '✓ Partner: ' || p.company_name
    END as partner_status
FROM public.trips t
LEFT JOIN public.routes r ON t.route_id = r.route_id
LEFT JOIN public.buses b ON t.bus_id = b.bus_id
LEFT JOIN public.bus_classes bc ON b.bus_class_id = bc.bus_class_id
LEFT JOIN public.partners p ON t.partner_id = p.partner_id
LIMIT 10;

-- 11. اختبار البحث بمعاملات مختلفة
-- هذا سيساعدنا في معرفة ما هي المعاملات الصحيحة

-- أولاً: احصل على أسماء المدن الفعلية
SELECT DISTINCT 
    '11. Actual City Names' as info,
    origin_city,
    destination_city
FROM public.routes;

-- ثانياً: احصل على أسماء الفئات الفعلية
SELECT DISTINCT 
    '12. Actual Bus Classes' as info,
    class_name
FROM public.bus_classes;

-- ثالثاً: احصل على التواريخ المتاحة
SELECT DISTINCT 
    '13. Available Dates' as info,
    DATE(departure_time) as available_date
FROM public.trips
WHERE DATE(departure_time) >= CURRENT_DATE
ORDER BY available_date
LIMIT 10;
