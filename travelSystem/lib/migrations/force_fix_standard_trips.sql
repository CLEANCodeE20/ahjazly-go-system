-- =============================================
-- FORCE FIX FOR STANDARD TRIPS
-- قم بتشغيل هذا السكريبت في Supabase SQL Editor
-- =============================================

-- 1. التأكد من وجود الفئات بالأسماء الصحيحة
INSERT INTO public.bus_classes (bus_class_id, class_name, description, price_adjustment_factor)
VALUES 
    (1, 'VIP', 'درجة VIP فاخرة', 1.50),
    (2, 'Standard', 'درجة عادية', 1.00)
ON CONFLICT (bus_class_id) DO UPDATE 
SET class_name = EXCLUDED.class_name;

-- 2. تحديث جميع الحافلات التي نوعها 'standard' لتتبع فئة Standard (ID: 2)
UPDATE public.buses
SET bus_class_id = 2
WHERE bus_type = 'standard' OR bus_type IS NULL;

-- 3. التأكد من وجود مقاعد لجميع الحافلات (إذا لم توجد مقاعد لن تظهر الرحلة)
INSERT INTO public.seats (bus_id, seat_number, is_available)
SELECT b.bus_id, 'S' || s.num, true
FROM public.buses b
CROSS JOIN generate_series(1, 30) as s(num)
WHERE NOT EXISTS (SELECT 1 FROM public.seats WHERE bus_id = b.bus_id);

-- 4. تحديث حالة الرحلات لتكون 'scheduled'
UPDATE public.trips SET status = 'scheduled' WHERE status IS NULL;

-- 5. إضافة رحلة تجريبية "عادي" لليوم (للتأكد من الظهور)
-- ملاحظة: تأكد من وجود مسار (Route) بين صنعاء وعدن أو استبدلهما بمدن موجودة لديك
DO $$
DECLARE
    v_route_id BIGINT;
    v_bus_id BIGINT;
    v_partner_id BIGINT;
BEGIN
    -- جلب أول مسار متاح
    SELECT route_id, partner_id INTO v_route_id, v_partner_id FROM public.routes LIMIT 1;
    -- جلب أول حافلة عادية
    SELECT bus_id INTO v_bus_id FROM public.buses WHERE bus_class_id = 2 LIMIT 1;

    IF v_route_id IS NOT NULL AND v_bus_id IS NOT NULL THEN
        INSERT INTO public.trips (partner_id, route_id, bus_id, departure_time, arrival_time, base_price, status)
        VALUES (v_partner_id, v_route_id, v_bus_id, CURRENT_DATE + interval '10 hours', CURRENT_DATE + interval '18 hours', 5000, 'scheduled');
        RAISE NOTICE 'Test Standard trip added successfully';
    ELSE
        RAISE NOTICE 'Could not add test trip: Missing Route or Standard Bus';
    END IF;
END $$;

-- 6. فحص النتيجة النهائية
SELECT 'Final Check' as info;
SELECT 
    t.trip_id, 
    bc.class_name as class,
    r.origin_city, 
    r.destination_city,
    (SELECT COUNT(*) FROM public.seats s WHERE s.bus_id = t.bus_id) as seats_count
FROM public.trips t
JOIN public.buses b ON t.bus_id = b.bus_id
JOIN public.bus_classes bc ON b.bus_class_id = bc.bus_class_id
JOIN public.routes r ON t.route_id = r.route_id
WHERE t.departure_time >= CURRENT_DATE;
