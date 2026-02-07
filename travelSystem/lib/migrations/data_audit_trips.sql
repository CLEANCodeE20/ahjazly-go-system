-- =============================================
-- DATA AUDIT: SHOW ALL TRIPS AND CLASSES
-- هذا السكريبت يعرض كل شيء لنعرف المسميات الفعلية
-- =============================================

-- 1. عرض كافة فئات الحافلات الموجودة
SELECT '1. All Bus Classes' as info;
SELECT * FROM public.bus_classes;

-- 2. عرض كافة الرحلات المجدولة مع مسميات فئاتها (مهما كان المسمى)
SELECT '2. All Scheduled Trips with their Classes' as info;
SELECT 
    t.trip_id, 
    t.departure_time, 
    bc.class_name as actual_class_name,
    r.origin_city,
    r.destination_city,
    t.status
FROM public.trips t
LEFT JOIN public.buses b ON t.bus_id = b.bus_id
LEFT JOIN public.bus_classes bc ON b.bus_class_id = bc.bus_class_id
LEFT JOIN public.routes r ON t.route_id = r.route_id
WHERE t.departure_time >= CURRENT_DATE
ORDER BY t.departure_time ASC;

-- 3. فحص الحافلات التي لا تملك فئة (قد يكون هذا هو السبب)
SELECT '3. Buses without Class Assignment' as info;
SELECT bus_id, license_plate, bus_type, bus_class_id 
FROM public.buses 
WHERE bus_class_id IS NULL;
