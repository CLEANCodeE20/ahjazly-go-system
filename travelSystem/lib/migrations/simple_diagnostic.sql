-- =============================================
-- SIMPLE DIAGNOSTIC - Find the exact problem
-- تشخيص بسيط - اكتشاف المشكلة بالضبط
-- =============================================

-- 1. هل توجد رحلات أصلاً؟
SELECT 'Total Trips' as check, COUNT(*) as count FROM public.trips;

-- 2. هل الرحلات مرتبطة بمسارات؟
SELECT 
    'Trips with Routes' as check,
    COUNT(*) as trips_with_routes
FROM public.trips t
WHERE t.route_id IS NOT NULL;

-- 3. هل الرحلات مرتبطة بحافلات؟
SELECT 
    'Trips with Buses' as check,
    COUNT(*) as trips_with_buses
FROM public.trips t
WHERE t.bus_id IS NOT NULL;

-- 4. تفاصيل الرحلات الخام (بدون joins)
SELECT 
    trip_id,
    route_id,
    bus_id,
    partner_id,
    departure_time,
    base_price,
    status
FROM public.trips
LIMIT 5;

-- 5. هل توجد مسارات؟
SELECT 'Total Routes' as check, COUNT(*) as count FROM public.routes;

-- 6. تفاصيل المسارات
SELECT 
    route_id,
    origin_city,
    destination_city,
    partner_id
FROM public.routes
LIMIT 5;

-- 7. هل توجد حافلات؟
SELECT 'Total Buses' as check, COUNT(*) as count FROM public.buses;

-- 8. تفاصيل الحافلات
SELECT 
    bus_id,
    bus_class_id,
    model,
    partner_id,
    status
FROM public.buses
LIMIT 5;

-- 9. هل توجد فئات حافلات؟
SELECT 'Total Bus Classes' as check, COUNT(*) as count FROM public.bus_classes;

-- 10. تفاصيل فئات الحافلات
SELECT 
    bus_class_id,
    class_name,
    description
FROM public.bus_classes;

-- 11. محاولة JOIN واحدة فقط (trips + routes)
SELECT 
    t.trip_id,
    t.route_id,
    r.origin_city,
    r.destination_city
FROM public.trips t
LEFT JOIN public.routes r ON t.route_id = r.route_id
LIMIT 5;

-- 12. محاولة JOIN (trips + buses + bus_classes)
SELECT 
    t.trip_id,
    t.bus_id,
    b.model,
    b.bus_class_id,
    bc.class_name
FROM public.trips t
LEFT JOIN public.buses b ON t.bus_id = b.bus_id
LEFT JOIN public.bus_classes bc ON b.bus_class_id = bc.bus_class_id
LIMIT 5;
