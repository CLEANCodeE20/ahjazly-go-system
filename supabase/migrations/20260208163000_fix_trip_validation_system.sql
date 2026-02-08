-- ========================================================
-- FIX: Trip Resource Validation System (v2)
-- Date: 2026-02-08
-- Purpose: إصلاح نظام التحقق من توفر الباصات والسائقين
-- Note: يحذف جميع النسخ القديمة من الدوال قبل إنشاء النسخ الجديدة
-- ========================================================

BEGIN;

-- ========================================================
-- 1. حذف جميع النسخ القديمة من الدوال
-- ========================================================
DROP FUNCTION IF EXISTS public.check_bus_availability(BIGINT, TIMESTAMP, TIMESTAMP, BIGINT) CASCADE;
DROP FUNCTION IF EXISTS public.check_bus_availability(BIGINT, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, BIGINT) CASCADE;
DROP FUNCTION IF EXISTS public.check_driver_availability(BIGINT, TIMESTAMP, TIMESTAMP, BIGINT) CASCADE;
DROP FUNCTION IF EXISTS public.check_driver_availability(BIGINT, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, BIGINT) CASCADE;
DROP FUNCTION IF EXISTS public.validate_trip_resources() CASCADE;
DROP FUNCTION IF EXISTS public.get_conflicting_trips(BIGINT, BIGINT, TIMESTAMP, TIMESTAMP) CASCADE;
DROP FUNCTION IF EXISTS public.get_conflicting_trips(BIGINT, BIGINT, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) CASCADE;

-- ========================================================
-- 2. دالة التحقق من توفر الباص
-- ========================================================
CREATE FUNCTION public.check_bus_availability(
    p_bus_id BIGINT,
    p_departure_time TIMESTAMP WITH TIME ZONE,
    p_arrival_time TIMESTAMP WITH TIME ZONE,
    p_exclude_trip_id BIGINT DEFAULT NULL
)
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_conflict_count INTEGER;
    v_bus_status TEXT;
    v_bus_exists BOOLEAN;
BEGIN
    -- التحقق من وجود الباص
    SELECT EXISTS(SELECT 1 FROM public.buses WHERE bus_id = p_bus_id) INTO v_bus_exists;
    
    IF NOT v_bus_exists THEN
        RAISE EXCEPTION 'الباص رقم % غير موجود في النظام', p_bus_id;
    END IF;
    
    -- التحقق من حالة الباص
    SELECT status INTO v_bus_status
    FROM public.buses 
    WHERE bus_id = p_bus_id;
    
    IF v_bus_status IS NULL OR v_bus_status != 'active' THEN
        RAISE EXCEPTION 'الباص رقم % غير متاح للاستخدام (الحالة: %)', 
            p_bus_id, COALESCE(v_bus_status, 'غير معروفة');
    END IF;
    
    -- التحقق من تعارض الرحلات
    SELECT COUNT(*) INTO v_conflict_count
    FROM public.trips
    WHERE bus_id = p_bus_id
    AND status IN ('scheduled', 'in_progress')
    AND (p_exclude_trip_id IS NULL OR trip_id != p_exclude_trip_id)
    AND (
        (departure_time, COALESCE(arrival_time, departure_time + INTERVAL '24 hours')) 
        OVERLAPS 
        (p_departure_time, COALESCE(p_arrival_time, p_departure_time + INTERVAL '24 hours'))
    );
    
    IF v_conflict_count > 0 THEN
        RAISE NOTICE 'Bus % has % conflicting trip(s)', p_bus_id, v_conflict_count;
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION public.check_bus_availability IS 
    'التحقق من توفر الباص للرحلة المحددة - يتحقق من الحالة والتعارضات الزمنية';

-- ========================================================
-- 3. دالة التحقق من توفر السائق
-- ========================================================
CREATE FUNCTION public.check_driver_availability(
    p_driver_id BIGINT,
    p_departure_time TIMESTAMP WITH TIME ZONE,
    p_arrival_time TIMESTAMP WITH TIME ZONE,
    p_exclude_trip_id BIGINT DEFAULT NULL
)
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_conflict_count INTEGER;
    v_driver_status TEXT;
    v_driver_exists BOOLEAN;
BEGIN
    -- التحقق من وجود السائق
    SELECT EXISTS(SELECT 1 FROM public.drivers WHERE driver_id = p_driver_id) INTO v_driver_exists;
    
    IF NOT v_driver_exists THEN
        RAISE EXCEPTION 'السائق رقم % غير موجود في النظام', p_driver_id;
    END IF;
    
    -- التحقق من حالة السائق
    SELECT status INTO v_driver_status
    FROM public.drivers 
    WHERE driver_id = p_driver_id;
    
    IF v_driver_status IS NULL OR v_driver_status != 'active' THEN
        RAISE EXCEPTION 'السائق رقم % غير متاح للعمل (الحالة: %)', 
            p_driver_id, COALESCE(v_driver_status, 'غير معروفة');
    END IF;
    
    -- التحقق من تعارض الرحلات
    SELECT COUNT(*) INTO v_conflict_count
    FROM public.trips
    WHERE driver_id = p_driver_id
    AND status IN ('scheduled', 'in_progress')
    AND (p_exclude_trip_id IS NULL OR trip_id != p_exclude_trip_id)
    AND (
        (departure_time, COALESCE(arrival_time, departure_time + INTERVAL '24 hours')) 
        OVERLAPS 
        (p_departure_time, COALESCE(p_arrival_time, p_departure_time + INTERVAL '24 hours'))
    );
    
    IF v_conflict_count > 0 THEN
        RAISE NOTICE 'Driver % has % conflicting trip(s)', p_driver_id, v_conflict_count;
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION public.check_driver_availability IS 
    'التحقق من توفر السائق للرحلة المحددة - يتحقق من الحالة والتعارضات الزمنية';

-- ========================================================
-- 4. دالة Trigger للتحقق من موارد الرحلة
-- ========================================================
CREATE FUNCTION public.validate_trip_resources()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_bus_available BOOLEAN;
    v_driver_available BOOLEAN;
    v_error_message TEXT;
BEGIN
    -- تسجيل محاولة الإدخال/التحديث
    RAISE DEBUG 'Validating trip resources: trip_id=%, bus_id=%, driver_id=%, departure=%', 
        NEW.trip_id, NEW.bus_id, NEW.driver_id, NEW.departure_time;
    
    -- التحقق من توفر الباص (إذا تم تحديده)
    IF NEW.bus_id IS NOT NULL THEN
        BEGIN
            v_bus_available := public.check_bus_availability(
                NEW.bus_id, 
                NEW.departure_time, 
                NEW.arrival_time,
                CASE WHEN TG_OP = 'UPDATE' THEN NEW.trip_id ELSE NULL END
            );
            
            IF NOT v_bus_available THEN
                v_error_message := format(
                    'الباص رقم %s مشغول في رحلة أخرى خلال الفترة من %s إلى %s. يرجى اختيار باص آخر أو تغيير موعد الرحلة.',
                    NEW.bus_id,
                    to_char(NEW.departure_time, 'YYYY-MM-DD HH24:MI'),
                    COALESCE(to_char(NEW.arrival_time, 'YYYY-MM-DD HH24:MI'), 'غير محدد')
                );
                RAISE EXCEPTION '%', v_error_message;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE EXCEPTION 'خطأ في التحقق من توفر الباص: %', SQLERRM;
        END;
    END IF;
    
    -- التحقق من توفر السائق (إذا تم تحديده)
    IF NEW.driver_id IS NOT NULL THEN
        BEGIN
            v_driver_available := public.check_driver_availability(
                NEW.driver_id, 
                NEW.departure_time, 
                NEW.arrival_time,
                CASE WHEN TG_OP = 'UPDATE' THEN NEW.trip_id ELSE NULL END
            );
            
            IF NOT v_driver_available THEN
                v_error_message := format(
                    'السائق رقم %s مشغول في رحلة أخرى خلال الفترة من %s إلى %s. يرجى اختيار سائق آخر أو تغيير موعد الرحلة.',
                    NEW.driver_id,
                    to_char(NEW.departure_time, 'YYYY-MM-DD HH24:MI'),
                    COALESCE(to_char(NEW.arrival_time, 'YYYY-MM-DD HH24:MI'), 'غير محدد')
                );
                RAISE EXCEPTION '%', v_error_message;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE EXCEPTION 'خطأ في التحقق من توفر السائق: %', SQLERRM;
        END;
    END IF;
    
    -- إذا نجحت جميع عمليات التحقق
    RAISE DEBUG 'Trip validation passed successfully';
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.validate_trip_resources IS 
    'دالة Trigger للتحقق التلقائي من توفر الباص والسائق قبل إضافة/تعديل الرحلة';

-- ========================================================
-- 5. إعادة إنشاء الـ Trigger
-- ========================================================
DROP TRIGGER IF EXISTS validate_trip_before_insert_or_update ON public.trips;

CREATE TRIGGER validate_trip_before_insert_or_update
    BEFORE INSERT OR UPDATE OF bus_id, driver_id, departure_time, arrival_time, status
    ON public.trips
    FOR EACH ROW
    WHEN (NEW.status IN ('scheduled', 'in_progress'))
    EXECUTE FUNCTION public.validate_trip_resources();

COMMENT ON TRIGGER validate_trip_before_insert_or_update ON public.trips IS 
    'التحقق التلقائي من توفر الباص والسائق قبل إضافة أو تعديل الرحلة';

-- ========================================================
-- 6. دالة مساعدة للحصول على الرحلات المتعارضة
-- ========================================================
CREATE FUNCTION public.get_conflicting_trips(
    p_bus_id BIGINT DEFAULT NULL,
    p_driver_id BIGINT DEFAULT NULL,
    p_departure_time TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_arrival_time TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
    trip_id BIGINT,
    route_info TEXT,
    departure_time TIMESTAMP WITH TIME ZONE,
    arrival_time TIMESTAMP WITH TIME ZONE,
    status TEXT,
    conflict_type TEXT,
    bus_id BIGINT,
    driver_id BIGINT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.trip_id,
        COALESCE(r.origin_city || ' → ' || r.destination_city, 'مسار غير محدد') AS route_info,
        t.departure_time,
        t.arrival_time,
        t.status::TEXT,
        CASE 
            WHEN t.bus_id = p_bus_id AND t.driver_id = p_driver_id THEN 'تعارض باص وسائق'
            WHEN t.bus_id = p_bus_id THEN 'تعارض باص'
            WHEN t.driver_id = p_driver_id THEN 'تعارض سائق'
            ELSE 'تعارض'
        END AS conflict_type,
        t.bus_id,
        t.driver_id
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
$$;

COMMENT ON FUNCTION public.get_conflicting_trips IS 
    'الحصول على قائمة تفصيلية بالرحلات المتعارضة لباص أو سائق معين';

-- ========================================================
-- 7. منح الصلاحيات اللازمة
-- ========================================================
GRANT EXECUTE ON FUNCTION public.check_bus_availability TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_driver_availability TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_conflicting_trips TO authenticated;

COMMIT;

-- ========================================================
-- 8. رسائل التأكيد
-- ========================================================
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ TRIP VALIDATION SYSTEM FIXED';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Changes applied:';
    RAISE NOTICE '  ✓ Removed all duplicate function definitions';
    RAISE NOTICE '  ✓ Created new bus availability validation';
    RAISE NOTICE '  ✓ Created new driver availability validation';
    RAISE NOTICE '  ✓ Created trigger validation function';
    RAISE NOTICE '  ✓ Enabled automatic trigger on trips table';
    RAISE NOTICE '  ✓ Added conflict detection helper';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'The system will now prevent:';
    RAISE NOTICE '  • Creating trips with busy buses';
    RAISE NOTICE '  • Creating trips with busy drivers';
    RAISE NOTICE '  • Time conflicts for resources';
    RAISE NOTICE '========================================';
END $$;
