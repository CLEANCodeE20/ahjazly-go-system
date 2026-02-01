-- ========================================================
-- IMPROVE SEAT AVAILABILITY CALCULATION
-- ========================================================

-- 1. Update get_available_seats to be more robust
CREATE OR REPLACE FUNCTION public.get_available_seats(p_trip_id BIGINT)
RETURNS JSONB AS $$
DECLARE
    v_bus_id BIGINT;
    v_blocked_seats JSONB;
    v_seats JSONB;
BEGIN
    -- Get bus_id and blocked_seats for the trip
    SELECT bus_id, COALESCE(blocked_seats, '[]'::jsonb) 
    INTO v_bus_id, v_blocked_seats 
    FROM public.trips 
    WHERE trip_id = p_trip_id;
    
    -- Fetch active seats for this bus
    SELECT jsonb_agg(
        jsonb_build_object(
            'seat_id', s.seat_id,
            'seat_number', s.seat_number,
            'is_available', (
                NOT EXISTS (
                    SELECT 1 FROM public.passengers p 
                    WHERE p.trip_id = p_trip_id AND p.seat_id = s.seat_id AND p.passenger_status = 'active'
                )
                AND NOT (v_blocked_seats @> jsonb_build_array(s.seat_number))
            )
        )
    ) INTO v_seats
    FROM public.seats s
    WHERE s.bus_id = v_bus_id AND s.is_available = true; -- Only active seats

    RETURN jsonb_build_object(
        'success', true,
        'seats', COALESCE(v_seats, '[]'::jsonb)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update search_trips with accurate availability count
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
    linked_trip_id BIGINT
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
        (t.base_price - 50) AS price_child,
        r.origin_city,
        r.destination_city,
        rs_from.stop_name AS route_from_stop,
        rs_to.stop_name AS route_to_stop,
        bu.model,
        bc.class_name AS bus_class,
        p.company_name,
        (
            SELECT COUNT(*) 
            FROM public.seats s
            WHERE s.bus_id = t.bus_id 
              AND s.is_available = true
              AND NOT EXISTS (
                  SELECT 1 FROM public.passengers pass 
                  WHERE pass.trip_id = t.trip_id AND pass.seat_id = s.seat_id AND pass.passenger_status = 'active'
              )
              AND NOT (COALESCE(t.blocked_seats, '[]'::jsonb) @> jsonb_build_array(s.seat_number))
        ) AS available_seats,
        t.bus_id AS trip_bus_id,
        COALESCE(bu.seat_layout, '{}'::jsonb) AS seat_layout,
        t.linked_trip_id
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
        DATE(t.departure_time) = _date
        AND rs_from.stop_name = _from_stop
        AND rs_to.stop_name = _to_city
        AND rs_from.stop_order < rs_to.stop_order
        AND bc.class_name = _bus_class;
END;
$$;
