-- =============================================
-- ROBUST TRIP SEARCH IMPROVEMENTS
-- تحسينات متقدمة للبحث عن الرحلات
-- =============================================

-- 1. تحديث دالة البحث لتكون أكثر مرونة
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
    trip_status VARCHAR
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
            (
                CASE 
                    WHEN EXISTS (SELECT 1 FROM public.seats s WHERE s.bus_id = t.bus_id) THEN
                        (SELECT COUNT(*) FROM public.seats s WHERE s.bus_id = t.bus_id AND s.is_available = true)
                    ELSE 
                        COALESCE(bu.capacity, 0)
                END
            ) - 
            (SELECT COUNT(*) FROM public.passengers pass WHERE pass.trip_id = t.trip_id AND pass.passenger_status = 'active') -
            (SELECT jsonb_array_length(COALESCE(t.blocked_seats, '[]'::jsonb)))
        ) AS available_seats,
        t.bus_id AS trip_bus_id,
        COALESCE(bu.seat_layout, '{}'::jsonb) AS seat_layout,
        t.linked_trip_id,
        t.status::VARCHAR AS trip_status
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
        -- البحث عن التاريخ
        DATE(t.departure_time) = _date
        
        -- بحث مرن عن المدن (تجاهل المسافات وحالة الأحرف)
        AND (TRIM(rs_from.stop_name) ILIKE TRIM(_from_stop) OR rs_from.stop_name ILIKE '%' || TRIM(_from_stop) || '%')
        AND (TRIM(rs_to.stop_name) ILIKE TRIM(_to_city) OR rs_to.stop_name ILIKE '%' || TRIM(_to_city) || '%')
        
        -- ترتيب المحطات
        AND rs_from.stop_order < rs_to.stop_order
        
        -- بحث مرن عن درجة الحافلة
        AND (bc.class_name ILIKE _bus_class OR _bus_class IS NULL OR _bus_class = '')
        
        -- حالة الرحلة
        AND t.status IN ('scheduled', 'in_progress', 'delayed')
        
        -- شرط الوقت (تم تقليله لـ 5 دقائق للمرونة)
        AND t.departure_time > NOW() + INTERVAL '5 minutes'
        
        -- التأكد من وجود مقاعد متاحة (مع Fallback للسعة)
        AND (
            (
                CASE 
                    WHEN EXISTS (SELECT 1 FROM public.seats s WHERE s.bus_id = t.bus_id) THEN
                        (SELECT COUNT(*) FROM public.seats s WHERE s.bus_id = t.bus_id AND s.is_available = true)
                    ELSE 
                        COALESCE(bu.capacity, 0)
                END
            ) - 
            (SELECT COUNT(*) FROM public.passengers pass WHERE pass.trip_id = t.trip_id AND pass.passenger_status = 'active') -
            (SELECT jsonb_array_length(COALESCE(t.blocked_seats, '[]'::jsonb)))
        ) > 0
    
    ORDER BY t.departure_time ASC;
END;
$$;

-- 2. تحديث دالة التحقق من إمكانية الحجز لتشمل نفس المنطق
CREATE OR REPLACE FUNCTION public.can_book_trip(p_trip_id BIGINT)
RETURNS JSON AS $$
DECLARE
    v_trip RECORD;
    v_available_seats INTEGER;
    v_time_until_departure INTERVAL;
BEGIN
    SELECT 
        t.trip_id,
        t.status,
        t.departure_time,
        t.bus_id,
        bu.capacity
    INTO v_trip
    FROM public.trips t
    JOIN public.buses bu ON t.bus_id = bu.bus_id
    WHERE t.trip_id = p_trip_id;
    
    IF v_trip.trip_id IS NULL THEN
        RETURN json_build_object('can_book', false, 'reason', 'trip_not_found', 'message', 'الرحلة غير موجودة');
    END IF;
    
    IF v_trip.status NOT IN ('scheduled', 'in_progress', 'delayed') THEN
        RETURN json_build_object('can_book', false, 'reason', 'trip_not_available', 'message', 'الرحلة غير متاحة للحجز');
    END IF;
    
    v_time_until_departure := v_trip.departure_time - NOW();
    
    IF v_time_until_departure < INTERVAL '5 minutes' THEN
        RETURN json_build_object('can_book', false, 'reason', 'too_late', 'message', 'عذراً، انتهى وقت الحجز لهذه الرحلة');
    END IF;
    
    -- حساب المقاعد المتاحة مع منطق الـ Fallback
    SELECT 
        (
            CASE 
                WHEN EXISTS (SELECT 1 FROM public.seats s WHERE s.bus_id = v_trip.bus_id) THEN
                    (SELECT COUNT(*) FROM public.seats s WHERE s.bus_id = v_trip.bus_id AND s.is_available = true)
                ELSE 
                    COALESCE(v_trip.capacity, 0)
            END
        ) - 
        (SELECT COUNT(*) FROM public.passengers pass WHERE pass.trip_id = p_trip_id AND pass.passenger_status = 'active') -
        (SELECT jsonb_array_length(COALESCE(blocked_seats, '[]'::jsonb)) FROM public.trips WHERE trip_id = p_trip_id)
    INTO v_available_seats;
    
    IF v_available_seats <= 0 THEN
        RETURN json_build_object('can_book', false, 'reason', 'no_seats', 'message', 'عذراً، لا توجد مقاعد متاحة');
    END IF;
    
    RETURN json_build_object('can_book', true, 'available_seats', v_available_seats, 'message', 'يمكن الحجز');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. تحديث الـ View للحفاظ على التزامن
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
        (
            CASE 
                WHEN EXISTS (SELECT 1 FROM public.seats s WHERE s.bus_id = t.bus_id) THEN
                    (SELECT COUNT(*) FROM public.seats s WHERE s.bus_id = t.bus_id AND s.is_available = true)
                ELSE 
                    COALESCE(bu.capacity, 0)
            END
        ) - 
        (SELECT COUNT(*) FROM public.passengers pass WHERE pass.trip_id = t.trip_id AND pass.passenger_status = 'active') -
        (SELECT jsonb_array_length(COALESCE(t.blocked_seats, '[]'::jsonb)))
    ) AS available_seats,
    EXTRACT(EPOCH FROM (t.departure_time - NOW())) / 60 AS minutes_until_departure
FROM public.trips t
JOIN public.routes r ON t.route_id = r.route_id
JOIN public.buses bu ON t.bus_id = bu.bus_id
JOIN public.partners p ON t.partner_id = p.partner_id
WHERE t.status IN ('scheduled', 'in_progress', 'delayed')
AND t.departure_time > NOW() + INTERVAL '5 minutes'
AND (
    (
        CASE 
            WHEN EXISTS (SELECT 1 FROM public.seats s WHERE s.bus_id = t.bus_id) THEN
                (SELECT COUNT(*) FROM public.seats s WHERE s.bus_id = t.bus_id AND s.is_available = true)
            ELSE 
                COALESCE(bu.capacity, 0)
        END
    ) - 
    (SELECT COUNT(*) FROM public.passengers pass WHERE pass.trip_id = t.trip_id AND pass.passenger_status = 'active') -
    (SELECT jsonb_array_length(COALESCE(t.blocked_seats, '[]'::jsonb)))
) > 0
ORDER BY t.departure_time ASC;
