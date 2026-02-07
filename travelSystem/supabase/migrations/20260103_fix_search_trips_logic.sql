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
    SELECT DISTINCT
        t.trip_id,
        t.departure_time,
        t.arrival_time,
        t.base_price AS price_adult,
        (t.base_price - 50) AS price_child,
        r.origin_city,
        r.destination_city,
        -- Determined from/to stop names (could be main cities or intermediate stops)
        COALESCE(rs_from.stop_name, r.origin_city) AS route_from_stop,
        COALESCE(rs_to.stop_name, r.destination_city) AS route_to_stop,
        bu.model,
        bc.class_name AS bus_class,
        p.company_name,
        (
            (
                SELECT COUNT(*) 
                FROM public.seats s
                WHERE s.bus_id = t.bus_id 
                  AND s.is_available = true
            ) 
            - 
            (
                SELECT COUNT(*)
                FROM public.passengers p
                JOIN public.bookings b ON p.booking_id = b.booking_id
                WHERE b.trip_id = t.trip_id 
                  AND b.booking_status NOT IN ('cancelled', 'expired', 'rejected') -- Adjust statuses as needed based on your ENUM
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
    -- Left join logic to check for stops if they exist
    LEFT JOIN
        public.route_stops rs_from ON rs_from.route_id = r.route_id AND rs_from.stop_name = _from_stop
    LEFT JOIN
        public.route_stops rs_to ON rs_to.route_id = r.route_id AND rs_to.stop_name = _to_city
    WHERE
        DATE(t.departure_time) = _date
        AND bc.class_name = _bus_class
        AND t.status != 'cancelled'
        AND (
            -- Case 1: Direct Main Route (Origin -> Destination)
            (r.origin_city = _from_stop AND r.destination_city = _to_city)
            OR
            -- Case 2: Origin -> Stop (Intermediate)
            (r.origin_city = _from_stop AND rs_to.stop_name IS NOT NULL)
            OR
            -- Case 3: Stop (Intermediate) -> Destination
            (rs_from.stop_name IS NOT NULL AND r.destination_city = _to_city)
            OR
            -- Case 4: Stop -> Stop (Both Intermediate)
            (rs_from.stop_name IS NOT NULL AND rs_to.stop_name IS NOT NULL AND rs_from.stop_order < rs_to.stop_order)
        );
END;
$$;
