-- =============================================
-- FIX MISSING STOP SCRIPT
-- إضافة "إب" كنقطة توقف للمسار (تعز -> مكه)
-- =============================================

-- 1. تعريف المتغيرات (سنستخدم استعلامات فرعية لضمان التوافق)
-- Trip ID 15 is the scheduled trip on 2026-01-23

-- 2. عرض نقاط التوقف الحالية للمسار (للتأكد)
SELECT 'Current Stops' as info, * 
FROM public.route_stops 
WHERE route_id = (SELECT route_id FROM public.trips WHERE trip_id = 15);

-- 3. إضافة "إب" إذا لم تكن موجودة
INSERT INTO public.route_stops (route_id, stop_name, stop_order, stop_location)
SELECT 
    (SELECT route_id FROM public.trips WHERE trip_id = 15), -- Route ID
    'إب', -- Stop Name
    1,    -- Stop Order (Assuming Taiz is 0, Makkah is last)
    'محطة إب المركزية' -- Default location
WHERE NOT EXISTS (
    SELECT 1 FROM public.route_stops 
    WHERE route_id = (SELECT route_id FROM public.trips WHERE trip_id = 15)
    AND (stop_name LIKE '%إب%' OR stop_name LIKE '%اب%')
);

-- 4. التحقق بعد الإضافة
SELECT 'Stops After Fix' as info, * 
FROM public.route_stops 
WHERE route_id = (SELECT route_id FROM public.trips WHERE trip_id = 15);

-- 5. تجربة البحث مرة أخرى (محاكاة)
-- يجب أن تظهر الرحلة الآن لأن "إب" أصبحت نقطة توقف معروفة
SELECT 'Search Test' as info, * 
FROM public.search_trips('إب', 'مكه', '2026-01-23', 'VIP');
