-- Create search_trips RPC function for Flutter app
-- This function is called by the mobile app to search for available trips

-- Drop existing function if it exists (with any signature)
DROP FUNCTION IF EXISTS search_trips CASCADE;
DROP FUNCTION IF EXISTS search_trips(TEXT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS search_trips(TEXT, TEXT, TEXT) CASCADE;

CREATE OR REPLACE FUNCTION search_trips(
    _from_stop TEXT,
    _to_city TEXT,
    _date TEXT,
    _bus_class TEXT DEFAULT ''
)
RETURNS TABLE (
    trip_id BIGINT,
    partner_id BIGINT,
    route_id BIGINT,
    bus_id BIGINT,
    driver_id BIGINT,
    departure_time TIMESTAMP,
    arrival_time TIMESTAMP,
    base_price NUMERIC,
    price_adult NUMERIC,
    price_child NUMERIC,
    status VARCHAR,
    origin_city TEXT,
    destination_city TEXT,
    route_from_stop TEXT,
    model TEXT,
    bus_class TEXT,
    company_name TEXT,
    available_seats BIGINT,
    trip_bus_id BIGINT,
    seat_layout JSONB,
    linked_trip_id BIGINT,
    trip_status VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH route_points AS (
        -- نقطة البداية الأساسية (الترتيب 0)
        SELECT r.route_id, r.origin_city as city_name, 0 as point_order
        FROM public.routes r
        UNION ALL
        -- المحطات الوسيطة
        SELECT rs.route_id, rs.stop_name as city_name, rs.stop_order as point_order
        FROM public.route_stops rs
        UNION ALL
        -- نقطة النهاية الأساسية (ترتيب مرتفع جداً)
        SELECT r.route_id, r.destination_city as city_name, 999999 as point_order
        FROM public.routes r
    )
    SELECT 
        t.trip_id,
        t.partner_id,
        t.route_id,
        t.bus_id,
        t.driver_id,
        t.departure_time,
        t.arrival_time,
        t.base_price,
        t.base_price AS price_adult,
        t.base_price AS price_child,
        t.status::VARCHAR,
        r.origin_city::TEXT,
        r.destination_city::TEXT,
        rp_from.city_name::TEXT AS route_from_stop,
        bu.model::TEXT,
        COALESCE(bu.model, 'Standard')::TEXT AS bus_class,
        p.company_name::TEXT,
        (
            CASE 
                WHEN EXISTS (SELECT 1 FROM public.seats s WHERE s.bus_id = t.bus_id) THEN
                    (SELECT COUNT(*) FROM public.seats s WHERE s.bus_id = t.bus_id)
                ELSE 
                    COALESCE(bu.capacity, 0)
            END
            - (
                SELECT COUNT(*) 
                FROM public.passengers pass 
                WHERE pass.trip_id = t.trip_id 
                AND pass.passenger_status NOT IN ('cancelled', 'refunded')
            )
            - (
                SELECT COALESCE(jsonb_array_length(t.blocked_seats), 0)
            )
        )::BIGINT AS available_seats,
        t.bus_id AS trip_bus_id,
        COALESCE(bu.seat_layout, '{}'::jsonb) AS seat_layout,
        t.linked_trip_id,
        t.status::VARCHAR AS trip_status
    FROM public.trips t
    JOIN public.routes r ON t.route_id = r.route_id
    JOIN route_points rp_from ON t.route_id = rp_from.route_id
    JOIN route_points rp_to ON t.route_id = rp_to.route_id
    LEFT JOIN public.buses bu ON t.bus_id = bu.bus_id
    LEFT JOIN public.partners p ON t.partner_id = p.partner_id
    WHERE t.status IN ('scheduled', 'in_progress')
    AND t.departure_time > NOW()
    AND rp_from.city_name ILIKE _from_stop
    AND rp_to.city_name ILIKE _to_city
    AND rp_from.point_order < rp_to.point_order -- التأكد من أن نقطة الصعود تسبق نقطة النزول
    AND (
        _bus_class = '' 
        OR bu.bus_type::TEXT ILIKE '%' || _bus_class || '%' 
        OR bu.model::TEXT ILIKE '%' || _bus_class || '%'
    )
    AND DATE(t.departure_time) = _date::DATE
    ORDER BY t.departure_time ASC;
END;
$$;

COMMENT ON FUNCTION search_trips IS 'Search for available trips by origin, destination, and date';
