-- =============================================
-- DEBUG SEARCH LOGIC
-- فحص منطق البحث يدوياً
-- =============================================

-- 1. تعريف المتغيرات
DROP TABLE IF EXISTS debug_params;
CREATE TEMP TABLE debug_params AS 
SELECT 
    'إب'::text as p_from,
    'مكه'::text as p_to,
    '2026-01-23'::date as p_date,
    'VIP'::text as p_class;

-- 2. فحص الـ JOINs خطوة بخطوة
SELECT 
    'Debug Join' as info,
    t.trip_id,
    r.origin_city,
    r.destination_city,
    rs_from.stop_name as from_stop_found,
    rs_to.stop_name as to_stop_found,
    bc.class_name
FROM public.trips t
JOIN public.routes r ON t.route_id = r.route_id
JOIN public.buses bu ON t.bus_id = bu.bus_id
JOIN public.bus_classes bc ON bu.bus_class_id = bc.bus_class_id
-- محاولة عمل JOIN لنقطة الصعود
LEFT JOIN public.route_stops rs_from ON rs_from.route_id = r.route_id 
    AND rs_from.stop_name = (SELECT p_from FROM debug_params)
-- محاولة عمل JOIN لنقطة النزول
LEFT JOIN public.route_stops rs_to ON rs_to.route_id = r.route_id 
    AND rs_to.stop_name = (SELECT p_to FROM debug_params)
WHERE 
    t.trip_id = 15;

-- 3. فحص شرط الـ WHERE الرئيسي
SELECT 
    'Debug Conditions' as info,
    t.trip_id,
    -- شرط التاريخ
    (DATE(t.departure_time) = (SELECT p_date FROM debug_params)) as date_match,
    -- شرط الفئة
    (bc.class_name = (SELECT p_class FROM debug_params)) as class_match,
    -- شرط الحالة
    (t.status = 'scheduled') as status_match,
    -- شرط المسار (الذي يفشل غالباً)
    (
        -- الحالة 1: من البداية للنهاية
        (r.origin_city = (SELECT p_from FROM debug_params) AND r.destination_city = (SELECT p_to FROM debug_params))
        OR
        -- الحالة 2: من نقطة توقف لنقطة توقف
        (rs_from.stop_name IS NOT NULL AND rs_to.stop_name IS NOT NULL AND rs_from.stop_order < rs_to.stop_order)
        OR
        -- الحالة 3: من البداية لنقطة توقف
        (r.origin_city = (SELECT p_from FROM debug_params) AND rs_to.stop_name IS NOT NULL)
        OR
        -- الحالة 4: من نقطة توقف للنهاية (حالتنا المتوقعة)
        (rs_from.stop_name IS NOT NULL AND r.destination_city = (SELECT p_to FROM debug_params))
    ) as route_condition_match
FROM public.trips t
JOIN public.routes r ON t.route_id = r.route_id
JOIN public.buses bu ON t.bus_id = bu.bus_id
JOIN public.bus_classes bc ON bu.bus_class_id = bc.bus_class_id
LEFT JOIN public.route_stops rs_from ON rs_from.route_id = r.route_id 
    AND rs_from.stop_name = (SELECT p_from FROM debug_params)
LEFT JOIN public.route_stops rs_to ON rs_to.route_id = r.route_id 
    AND rs_to.stop_name = (SELECT p_to FROM debug_params)
WHERE 
    t.trip_id = 15;
