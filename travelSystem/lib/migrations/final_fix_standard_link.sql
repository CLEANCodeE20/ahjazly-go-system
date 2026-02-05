-- =============================================
-- FINAL FIX: LINK STANDARD BUSES TO CLASS
-- قم بتشغيل هذا السكريبت في Supabase SQL Editor
-- =============================================

-- 1. التأكد من وجود فئة Standard في جدول الفئات
-- سنبحث عنها بالاسم أولاً لتجنب تعارض المعرفات (IDs)
DO $$ 
DECLARE
    v_class_id BIGINT;
BEGIN
    -- البحث عن معرف فئة Standard
    SELECT bus_class_id INTO v_class_id FROM public.bus_classes WHERE class_name = 'Standard' LIMIT 1;

    -- إذا لم تكن موجودة، سنقوم بإنشائها
    IF v_class_id IS NULL THEN
        INSERT INTO public.bus_classes (class_name, description, price_adjustment_factor)
        VALUES ('Standard', 'درجة عادية', 1.00)
        RETURNING bus_class_id INTO v_class_id;
        RAISE NOTICE 'Created new Standard class with ID: %', v_class_id;
    END IF;

    -- 2. ربط كافة الحافلات التي نوعها 'standard' بهذه الفئة
    UPDATE public.buses
    SET bus_class_id = v_class_id
    WHERE bus_type = 'standard' OR bus_class_id IS NULL;
    
    RAISE NOTICE 'Linked all standard buses to class ID: %', v_class_id;

    -- 3. التأكد من وجود مقاعد لهذه الحافلات (ضروري لظهور الرحلة)
    INSERT INTO public.seats (bus_id, seat_number, is_available)
    SELECT b.bus_id, 'S' || s.num, true
    FROM public.buses b
    CROSS JOIN generate_series(1, 30) as s(num)
    WHERE b.bus_class_id = v_class_id
      AND NOT EXISTS (SELECT 1 FROM public.seats WHERE bus_id = b.bus_id);
      
    RAISE NOTICE 'Ensured seats exist for standard buses';
END $$;

-- 4. فحص النتيجة
SELECT 
    b.bus_id, 
    b.license_plate, 
    bc.class_name as linked_class
FROM public.buses b
JOIN public.bus_classes bc ON b.bus_class_id = bc.bus_class_id
WHERE bc.class_name = 'Standard';
