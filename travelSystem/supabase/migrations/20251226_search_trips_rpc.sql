-- Function to search trips with intermediate stops logic, matching PHP backend behavior
-- Params: _from_stop, _to_city, _date, _bus_class

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
        (t.base_price - 50) AS price_child, -- Logic from PHP: base_price - 50
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
        AND rs_from.stop_order < rs_to.stop_order -- Direction check
        AND bc.class_name = _bus_class;
END;
$$;
