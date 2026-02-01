-- ========================================================
-- TRIP RESOURCE VALIDATION
-- ========================================================
-- هذا الملف يضيف التحقق من توفر الباصات والسائقين قبل إضافة/تعديل الرحلات
-- لمنع تعارض الرحلات وضمان عدم إضافة رحلة لباص أو سائق مشغول

BEGIN;

-- ========================================================
-- 1. دالة التحقق من توفر الباص
-- ========================================================
CREATE OR REPLACE FUNCTION public.check_bus_availability(
    p_bus_id BIGINT,
    p_departure_time TIMESTAMP,
    p_arrival_time TIMESTAMP,
    p_exclude_trip_id BIGINT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_conflict_count INTEGER;
    v_bus_status TEXT;
BEGIN
    -- التحقق من وجود الباص وحالته
    SELECT status INTO v_bus_status
    FROM public.buses 
    WHERE bus_id = p_bus_id;
    
    -- إذا لم يتم العثور على الباص
    IF v_bus_status IS NULL THEN
        RAISE EXCEPTION 'الباص رقم % غير موجود', p_bus_id;
    END IF;
    
    -- التحقق من حالة الباص
    IF v_bus_status != 'active' THEN
        RAISE EXCEPTION 'الباص رقم % غير متاح (الحالة: %)', p_bus_id, v_bus_status;
    END IF;
    
    -- التحقق من تعارض الرحلات
    -- نستخدم OVERLAPS للتحقق من تداخل الأوقات
    SELECT COUNT(*) INTO v_conflict_count
    FROM public.trips
    WHERE bus_id = p_bus_id
    AND status IN ('scheduled', 'in_progress')
    AND (trip_id != p_exclude_trip_id OR p_exclude_trip_id IS NULL)
    AND (
        -- التحقق من تداخل الأوقات
        (departure_time, COALESCE(arrival_time, departure_time + INTERVAL '24 hours')) 
        OVERLAPS 
        (p_departure_time, COALESCE(p_arrival_time, p_departure_time + INTERVAL '24 hours'))
    );
    
    -- إذا وجدنا تعارض
    IF v_conflict_count > 0 THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.check_bus_availability IS 'التحقق من توفر الباص للرحلة المحددة';

-- ========================================================
-- 2. دالة التحقق من توفر السائق
-- ========================================================
CREATE OR REPLACE FUNCTION public.check_driver_availability(
    p_driver_id BIGINT,
    p_departure_time TIMESTAMP,
    p_arrival_time TIMESTAMP,
    p_exclude_trip_id BIGINT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_conflict_count INTEGER;
    v_driver_status TEXT;
BEGIN
    -- التحقق من وجود السائق وحالته
    SELECT status INTO v_driver_status
    FROM public.drivers 
    WHERE driver_id = p_driver_id;
    
    -- إذا لم يتم العثور على السائق
    IF v_driver_status IS NULL THEN
        RAISE EXCEPTION 'السائق رقم % غير موجود', p_driver_id;
    END IF;
    
    -- التحقق من حالة السائق
    IF v_driver_status != 'active' THEN
        RAISE EXCEPTION 'السائق رقم % غير متاح (الحالة: %)', p_driver_id, v_driver_status;
    END IF;
    
    -- التحقق من تعارض الرحلات
    SELECT COUNT(*) INTO v_conflict_count
    FROM public.trips
    WHERE driver_id = p_driver_id
    AND status IN ('scheduled', 'in_progress')
    AND (trip_id != p_exclude_trip_id OR p_exclude_trip_id IS NULL)
    AND (
        -- التحقق من تداخل الأوقات
        (departure_time, COALESCE(arrival_time, departure_time + INTERVAL '24 hours')) 
        OVERLAPS 
        (p_departure_time, COALESCE(p_arrival_time, p_departure_time + INTERVAL '24 hours'))
    );
    
    -- إذا وجدنا تعارض
    IF v_conflict_count > 0 THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.check_driver_availability IS 'التحقق من توفر السائق للرحلة المحددة';

-- ========================================================
-- 3. دالة التحقق من موارد الرحلة (Trigger Function)
-- ========================================================
CREATE OR REPLACE FUNCTION public.validate_trip_resources()
RETURNS TRIGGER AS $$
DECLARE
    v_bus_available BOOLEAN;
    v_driver_available BOOLEAN;
BEGIN
    -- التحقق من توفر الباص (إذا تم تحديده)
    IF NEW.bus_id IS NOT NULL THEN
        BEGIN
            v_bus_available := public.check_bus_availability(
                NEW.bus_id, 
                NEW.departure_time, 
                NEW.arrival_time,
                NEW.trip_id
            );
        EXCEPTION
            WHEN OTHERS THEN
                RAISE EXCEPTION 'خطأ في التحقق من الباص: %', SQLERRM;
        END;
        
        IF NOT v_bus_available THEN
            RAISE EXCEPTION 'الباص رقم % مشغول في رحلة أخرى خلال الفترة من % إلى %', 
                NEW.bus_id, 
                NEW.departure_time::TEXT, 
                COALESCE(NEW.arrival_time::TEXT, 'غير محدد');
        END IF;
    END IF;
    
    -- التحقق من توفر السائق (إذا تم تحديده)
    IF NEW.driver_id IS NOT NULL THEN
        BEGIN
            v_driver_available := public.check_driver_availability(
                NEW.driver_id, 
                NEW.departure_time, 
                NEW.arrival_time,
                NEW.trip_id
            );
        EXCEPTION
            WHEN OTHERS THEN
                RAISE EXCEPTION 'خطأ في التحقق من السائق: %', SQLERRM;
        END;
        
        IF NOT v_driver_available THEN
            RAISE EXCEPTION 'السائق رقم % مشغول في رحلة أخرى خلال الفترة من % إلى %', 
                NEW.driver_id, 
                NEW.departure_time::TEXT, 
                COALESCE(NEW.arrival_time::TEXT, 'غير محدد');
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.validate_trip_resources IS 'دالة Trigger للتحقق من توفر الباص والسائق قبل إضافة/تعديل الرحلة';

-- ========================================================
-- 4. إنشاء Trigger على جدول الرحلات
-- ========================================================
DROP TRIGGER IF EXISTS validate_trip_before_insert_or_update ON public.trips;

CREATE TRIGGER validate_trip_before_insert_or_update
    BEFORE INSERT OR UPDATE ON public.trips
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_trip_resources();

COMMENT ON TRIGGER validate_trip_before_insert_or_update ON public.trips IS 
    'التحقق التلقائي من توفر الباص والسائق قبل إضافة أو تعديل الرحلة';

-- ========================================================
-- 5. دالة مساعدة للحصول على الرحلات المتعارضة
-- ========================================================
CREATE OR REPLACE FUNCTION public.get_conflicting_trips(
    p_bus_id BIGINT DEFAULT NULL,
    p_driver_id BIGINT DEFAULT NULL,
    p_departure_time TIMESTAMP DEFAULT NULL,
    p_arrival_time TIMESTAMP DEFAULT NULL
)
RETURNS TABLE (
    trip_id BIGINT,
    route_info TEXT,
    departure_time TIMESTAMP,
    arrival_time TIMESTAMP,
    status TEXT,
    conflict_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.trip_id,
        r.origin_city || ' → ' || r.destination_city AS route_info,
        t.departure_time,
        t.arrival_time,
        t.status::TEXT,
        CASE 
            WHEN t.bus_id = p_bus_id THEN 'تعارض باص'
            WHEN t.driver_id = p_driver_id THEN 'تعارض سائق'
            ELSE 'تعارض'
        END AS conflict_type
    FROM public.trips t
    LEFT JOIN public.routes r ON t.route_id = r.route_id
    WHERE t.status IN ('scheduled', 'in_progress')
    AND (
        (p_bus_id IS NOT NULL AND t.bus_id = p_bus_id)
        OR
        (p_driver_id IS NOT NULL AND t.driver_id = p_driver_id)
    )
    AND (
        p_departure_time IS NULL 
        OR
        (t.departure_time, COALESCE(t.arrival_time, t.departure_time + INTERVAL '24 hours')) 
        OVERLAPS 
        (p_departure_time, COALESCE(p_arrival_time, p_departure_time + INTERVAL '24 hours'))
    )
    ORDER BY t.departure_time;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.get_conflicting_trips IS 'الحصول على قائمة الرحلات المتعارضة لباص أو سائق معين';

COMMIT;
