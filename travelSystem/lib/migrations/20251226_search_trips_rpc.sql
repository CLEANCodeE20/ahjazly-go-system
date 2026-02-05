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
    available_seats BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
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
        ) AS available_seats
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
    -- Left joins for stops to allow direct route matching
    LEFT JOIN
        public.route_stops rs_from ON rs_from.route_id = r.route_id AND rs_from.stop_name = _from_stop
    LEFT JOIN
        public.route_stops rs_to ON rs_to.route_id = r.route_id AND rs_to.stop_name = _to_city
    WHERE
        DATE(t.departure_time) = _date
        AND bc.class_name = _bus_class
        AND (
            -- Case 1: Direct Match in Routes Table
            (r.origin_city = _from_stop AND r.destination_city = _to_city)
            OR
            -- Case 2: Match in Route Stops (Start -> End or Intermediate)
            (
                rs_from.stop_name IS NOT NULL 
                AND rs_to.stop_name IS NOT NULL
                AND rs_from.stop_order < rs_to.stop_order
            )
        );
END;
$$;
