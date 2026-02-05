-- =============================================
-- FIX SEARCH FUNCTION
-- تحديث دالة البحث لتكون أكثر مرونة مع النصوص العربية
-- =============================================

-- Drop the function first to allow return type changes
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
    origin_city TEXT,
    destination_city TEXT,
    route_from_stop TEXT,
    route_to_stop TEXT,
    model TEXT,
    bus_class TEXT,
    company_name TEXT,
    available_seats BIGINT,
    trip_bus_id BIGINT,
    seat_layout JSONB,
    linked_trip_id BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    _from_normalized TEXT;
    _to_normalized TEXT;
    _class_normalized TEXT;
BEGIN
    -- Normalize inputs
    _from_normalized := TRIM(LOWER(_from_stop));
    _to_normalized := TRIM(LOWER(_to_city));
    _class_normalized := TRIM(COALESCE(_bus_class, ''));
    
    RETURN QUERY
    SELECT
        t.trip_id,
        t.departure_time,
        t.arrival_time,
        t.base_price AS price_adult,
        (t.base_price - 50) AS price_child,
        r.origin_city::TEXT,
        r.destination_city::TEXT,
        COALESCE(rs_from.stop_name, r.origin_city)::TEXT AS route_from_stop,
        COALESCE(rs_to.stop_name, r.destination_city)::TEXT AS route_to_stop,
        bu.model::TEXT,
        bc.class_name::TEXT AS bus_class,
        p.company_name::TEXT,
        (
            SELECT COUNT(*) 
            FROM public.seats s
            WHERE s.bus_id = t.bus_id 
              AND s.is_available = true
              AND NOT EXISTS (
                  SELECT 1 FROM public.passengers p 
                  WHERE p.trip_id = t.trip_id 
                    AND p.seat_id = s.seat_id 
                    AND p.passenger_status = 'active'
              )
        ) AS available_seats,
        t.bus_id AS trip_bus_id,
        COALESCE(bu.seat_layout, '{}'::jsonb) AS seat_layout,
        t.linked_trip_id
    FROM
        public.trips t
    JOIN
        public.routes r ON t.route_id = r.route_id
    JOIN
        public.buses bu ON t.bus_id = bu.bus_id
    JOIN
        public.bus_classes bc ON bu.bus_class_id = bc.bus_class_id
    JOIN
        public.partners p ON t.partner_id = p.partner_id
    LEFT JOIN
        public.route_stops rs_from ON rs_from.route_id = r.route_id 
        AND (
            rs_from.stop_name = _from_stop 
            OR LOWER(TRIM(rs_from.stop_name)) = _from_normalized
            OR rs_from.stop_name LIKE '%' || _from_stop || '%'
        )
    LEFT JOIN
        public.route_stops rs_to ON rs_to.route_id = r.route_id 
        AND (
            rs_to.stop_name = _to_city 
            OR LOWER(TRIM(rs_to.stop_name)) = _to_normalized
            OR rs_to.stop_name LIKE '%' || _to_city || '%'
        )
    WHERE
        DATE(t.departure_time) = _date
        AND (_class_normalized = '' OR LOWER(bc.class_name) = LOWER(_class_normalized))
        AND t.status = 'scheduled'
        AND (
            -- Case 1: Origin to Destination (Direct)
            (
                (r.origin_city = _from_stop OR LOWER(TRIM(r.origin_city)) = _from_normalized)
                AND 
                (r.destination_city = _to_city OR LOWER(TRIM(r.destination_city)) = _to_normalized)
            )
            OR
            -- Case 2: Stop to Stop
            (rs_from.stop_name IS NOT NULL AND rs_to.stop_name IS NOT NULL AND rs_from.stop_order < rs_to.stop_order)
            OR
            -- Case 3: Origin to Stop
            (
                (r.origin_city = _from_stop OR LOWER(TRIM(r.origin_city)) = _from_normalized)
                AND rs_to.stop_name IS NOT NULL
            )
            OR
            -- Case 4: Stop to Destination
            (
                rs_from.stop_name IS NOT NULL 
                AND 
                (r.destination_city = _to_city OR LOWER(TRIM(r.destination_city)) = _to_normalized)
            )
        )
        AND (
            SELECT COUNT(*) 
            FROM public.seats s
            WHERE s.bus_id = t.bus_id 
              AND s.is_available = true
              AND NOT EXISTS (
                  SELECT 1 FROM public.passengers p 
                  WHERE p.trip_id = t.trip_id 
                    AND p.seat_id = s.seat_id 
                    AND p.passenger_status = 'active'
              )
        ) > 0
    ORDER BY t.departure_time ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_trips(TEXT, TEXT, DATE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_trips(TEXT, TEXT, DATE, TEXT) TO anon;

-- Verify immediately
SELECT * FROM public.search_trips('إب', 'مكه', '2026-01-23', 'VIP');
