-- =============================================
-- COMPREHENSIVE TRIP SEARCH & BOOKING IMPROVEMENTS
-- تحسينات شاملة للبحث والحجز
-- =============================================

-- =============================================
-- 1. تحديث دالة البحث عن الرحلات
-- =============================================

DROP FUNCTION IF EXISTS public.search_trips(TEXT, TEXT, DATE, TEXT);

CREATE OR REPLACE FUNCTION public.search_trips(
    _from_stop TEXT,
    _to_city TEXT,
    _date DATE,
    _bus_class TEXT
)
RETURNS TABLE (
    trip_id BIGINT,
    departure_time TIMESTAMP,
    arrival_time TIMESTAMP,
    price_adult NUMERIC,
    price_child NUMERIC,
    origin_city VARCHAR,
    destination_city VARCHAR,
    route_from_stop VARCHAR,
    route_to_stop VARCHAR,
    model VARCHAR,
    bus_class VARCHAR,
    company_name VARCHAR,
    available_seats BIGINT,
    trip_bus_id BIGINT,
    seat_layout JSONB,
    linked_trip_id BIGINT,
    trip_status VARCHAR  -- إضافة حالة الرحلة
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.trip_id,
        t.departure_time,
        t.arrival_time,
        t.base_price AS price_adult,
        (t.base_price) AS price_child,
        r.origin_city,
        r.destination_city,
        rs_from.stop_name AS route_from_stop,
        rs_to.stop_name AS route_to_stop,
        bu.model,
        bc.class_name AS bus_class,
        p.company_name,
        (
            (SELECT COUNT(*) FROM public.seats s WHERE s.bus_id = t.bus_id AND s.is_available = true) - 
            (SELECT COUNT(*) FROM public.passengers pass WHERE pass.trip_id = t.trip_id AND pass.passenger_status = 'active') -
            (SELECT jsonb_array_length(COALESCE(t.blocked_seats, '[]'::jsonb)))
        ) AS available_seats,
        t.bus_id AS trip_bus_id,
        COALESCE(bu.seat_layout, '{}'::jsonb) AS seat_layout,
        t.linked_trip_id,
        t.status::VARCHAR AS trip_status  -- إرجاع حالة الرحلة
    FROM
        public.trips t
    JOIN
        public.routes r ON t.route_id = r.route_id
    JOIN
        public.route_stops rs_from ON rs_from.route_id = r.route_id
    JOIN
        public.route_stops rs_to ON rs_to.route_id = r.route_id
    JOIN
        public.buses bu ON t.bus_id = bu.bus_id
    JOIN
        public.bus_classes bc ON bu.bus_class_id = bc.bus_class_id
    JOIN
        public.partners p ON t.partner_id = p.partner_id
    WHERE
        -- شروط البحث الأساسية
        DATE(t.departure_time) = _date
        AND rs_from.stop_name = _from_stop
        AND rs_to.stop_name = _to_city
        AND rs_from.stop_order < rs_to.stop_order
        AND bc.class_name = _bus_class
        
        -- ✅ شروط الحالة المحسّنة
        AND t.status IN ('scheduled', 'in_progress', 'delayed')
        
        -- ✅ شرط الوقت: يجب أن تكون الرحلة بعد 30 دقيقة على الأقل
        AND t.departure_time > NOW() + INTERVAL '30 minutes'
        
        -- ✅ التأكد من وجود مقاعد متاحة
        AND (
            (SELECT COUNT(*) FROM public.seats s WHERE s.bus_id = t.bus_id AND s.is_available = true) - 
            (SELECT COUNT(*) FROM public.passengers pass WHERE pass.trip_id = t.trip_id AND pass.passenger_status = 'active') -
            (SELECT jsonb_array_length(COALESCE(t.blocked_seats, '[]'::jsonb)))
        ) > 0
    
    ORDER BY t.departure_time ASC;
END;
$$;

COMMENT ON FUNCTION public.search_trips IS 
'بحث محسّن عن الرحلات المتاحة مع شروط زمنية وحالة محدثة';

-- =============================================
-- 2. دالة للتحقق من إمكانية الحجز
-- =============================================

CREATE OR REPLACE FUNCTION public.can_book_trip(p_trip_id BIGINT)
RETURNS JSON AS $$
DECLARE
    v_trip RECORD;
    v_available_seats INTEGER;
    v_time_until_departure INTERVAL;
BEGIN
    -- جلب معلومات الرحلة
    SELECT 
        trip_id,
        status,
        departure_time,
        bus_id
    INTO v_trip
    FROM public.trips
    WHERE trip_id = p_trip_id;
    
    -- التحقق من وجود الرحلة
    IF v_trip.trip_id IS NULL THEN
        RETURN json_build_object(
            'can_book', false,
            'reason', 'trip_not_found',
            'message', 'الرحلة غير موجودة'
        );
    END IF;
    
    -- التحقق من حالة الرحلة
    IF v_trip.status NOT IN ('scheduled', 'in_progress', 'delayed') THEN
        RETURN json_build_object(
            'can_book', false,
            'reason', 'trip_not_available',
            'message', 'الرحلة غير متاحة للحجز (الحالة: ' || v_trip.status || ')'
        );
    END IF;
    
    -- حساب الوقت المتبقي
    v_time_until_departure := v_trip.departure_time - NOW();
    
    -- التحقق من الوقت (30 دقيقة على الأقل)
    IF v_time_until_departure < INTERVAL '30 minutes' THEN
        RETURN json_build_object(
            'can_book', false,
            'reason', 'too_late',
            'message', 'عذراً، لا يمكن الحجز قبل موعد المغادرة بأقل من 30 دقيقة',
            'time_until_departure', EXTRACT(EPOCH FROM v_time_until_departure)
        );
    END IF;
    
    -- حساب المقاعد المتاحة
    SELECT 
        (SELECT COUNT(*) FROM public.seats s WHERE s.bus_id = v_trip.bus_id AND s.is_available = true) - 
        (SELECT COUNT(*) FROM public.passengers pass WHERE pass.trip_id = p_trip_id AND pass.passenger_status = 'active') -
        (SELECT jsonb_array_length(COALESCE(blocked_seats, '[]'::jsonb)) FROM public.trips WHERE trip_id = p_trip_id)
    INTO v_available_seats;
    
    -- التحقق من توفر المقاعد
    IF v_available_seats <= 0 THEN
        RETURN json_build_object(
            'can_book', false,
            'reason', 'no_seats',
            'message', 'عذراً، لا توجد مقاعد متاحة'
        );
    END IF;
    
    -- كل شيء على ما يرام
    RETURN json_build_object(
        'can_book', true,
        'available_seats', v_available_seats,
        'time_until_departure', EXTRACT(EPOCH FROM v_time_until_departure),
        'trip_status', v_trip.status,
        'message', 'يمكن الحجز'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.can_book_trip IS 
'التحقق الشامل من إمكانية الحجز على رحلة معينة';

-- =============================================
-- 3. Trigger لمنع الحجز على الرحلات غير المتاحة
-- =============================================

CREATE OR REPLACE FUNCTION public.validate_booking_before_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_check_result JSON;
BEGIN
    -- التحقق من إمكانية الحجز
    SELECT can_book_trip(NEW.trip_id) INTO v_check_result;
    
    -- إذا لم يكن الحجز ممكناً، رفض العملية
    IF (v_check_result->>'can_book')::BOOLEAN = false THEN
        RAISE EXCEPTION 'لا يمكن الحجز: %', v_check_result->>'message';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- حذف Trigger القديم إن وجد
DROP TRIGGER IF EXISTS validate_booking_trigger ON public.bookings;

-- إنشاء Trigger جديد
CREATE TRIGGER validate_booking_trigger
    BEFORE INSERT ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_booking_before_insert();

COMMENT ON FUNCTION public.validate_booking_before_insert IS 
'التحقق التلقائي من صحة الحجز قبل الإدراج';

-- =============================================
-- 4. دالة لإلغاء الرحلة تلقائياً بعد المغادرة
-- =============================================

CREATE OR REPLACE FUNCTION public.auto_cancel_expired_trips()
RETURNS INTEGER AS $$
DECLARE
    v_cancelled_count INTEGER;
BEGIN
    -- إلغاء الرحلات المجدولة التي مر موعدها
    UPDATE public.trips
    SET status = 'cancelled'
    WHERE status = 'scheduled'
    AND departure_time < NOW() - INTERVAL '1 hour';
    
    GET DIAGNOSTICS v_cancelled_count = ROW_COUNT;
    
    RETURN v_cancelled_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.auto_cancel_expired_trips IS 
'إلغاء تلقائي للرحلات المجدولة التي مر موعدها بساعة';

-- =============================================
-- 5. View لعرض الرحلات المتاحة للحجز
-- =============================================

CREATE OR REPLACE VIEW public.v_available_trips AS
SELECT 
    t.trip_id,
    t.departure_time,
    t.arrival_time,
    t.status,
    r.origin_city,
    r.destination_city,
    p.company_name,
    t.base_price,
    (
        (SELECT COUNT(*) FROM public.seats s WHERE s.bus_id = t.bus_id AND s.is_available = true) - 
        (SELECT COUNT(*) FROM public.passengers pass WHERE pass.trip_id = t.trip_id AND pass.passenger_status = 'active') -
        (SELECT jsonb_array_length(COALESCE(t.blocked_seats, '[]'::jsonb)))
    ) AS available_seats,
    EXTRACT(EPOCH FROM (t.departure_time - NOW())) / 60 AS minutes_until_departure
FROM public.trips t
JOIN public.routes r ON t.route_id = r.route_id
JOIN public.partners p ON t.partner_id = p.partner_id
WHERE t.status IN ('scheduled', 'in_progress', 'delayed')
AND t.departure_time > NOW() + INTERVAL '30 minutes'
AND (
    (SELECT COUNT(*) FROM public.seats s WHERE s.bus_id = t.bus_id AND s.is_available = true) - 
    (SELECT COUNT(*) FROM public.passengers pass WHERE pass.trip_id = t.trip_id AND pass.passenger_status = 'active') -
    (SELECT jsonb_array_length(COALESCE(t.blocked_seats, '[]'::jsonb)))
) > 0
ORDER BY t.departure_time ASC;

COMMENT ON VIEW public.v_available_trips IS 
'عرض الرحلات المتاحة للحجز فقط';
