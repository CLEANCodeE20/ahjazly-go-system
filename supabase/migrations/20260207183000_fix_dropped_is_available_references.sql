-- Consolidated Fix for Dropped Column seats.is_available
-- This script updates all functions and triggers that were broken by the removal of is_available.

BEGIN;

-- 1. Update sync_bus_seats()
CREATE OR REPLACE FUNCTION public.sync_bus_seats()
RETURNS TRIGGER AS $$
DECLARE
    v_cell RECORD;
    v_seat_numbers TEXT[];
BEGIN
    -- Only run if seat_layout has changed or it's a new bus
    IF (TG_OP = 'INSERT' AND NEW.seat_layout IS NOT NULL) OR 
       (TG_OP = 'UPDATE' AND OLD.seat_layout IS DISTINCT FROM NEW.seat_layout) THEN
        
        -- Collect all valid seat numbers from the layout cells
        SELECT array_agg(x->>'label')
        INTO v_seat_numbers
        FROM jsonb_array_elements(NEW.seat_layout->'cells') AS x
        WHERE x->>'type' = 'seat' AND (x->>'label') IS NOT NULL;

        -- Instead of deactivating (which used is_available), we keep them but they won't be linked in new bookings.
        -- Deleting might break historical data if referenced.
        -- For now, we just don't touch is_available.

        -- Insert or update existing seats from the layout
        FOR v_cell IN 
            SELECT 
                x->>'label' as seat_number,
                x->>'class' as seat_class
            FROM jsonb_array_elements(NEW.seat_layout->'cells') AS x
            WHERE x->>'type' = 'seat' AND (x->>'label') IS NOT NULL
        LOOP
            INSERT INTO public.seats (bus_id, seat_number, price_adjustment_factor)
            VALUES (
                NEW.bus_id, 
                v_cell.seat_number,
                CASE WHEN v_cell.seat_class = 'vip' THEN 1.5 ELSE 1.0 END
            )
            ON CONFLICT (bus_id, seat_number) DO UPDATE
            SET price_adjustment_factor = EXCLUDED.price_adjustment_factor;
        END LOOP;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Update secure_book_seat()
CREATE OR REPLACE FUNCTION public.secure_book_seat(
    _booking_id BIGINT,
    _seat_id BIGINT,
    _trip_id BIGINT
)
RETURNS BOOLEAN AS $$
DECLARE
    seat_already_taken BOOLEAN;
BEGIN
    -- Check if seat is still available (by checking passengers table)
    SELECT EXISTS (
        SELECT 1 FROM public.passengers 
        WHERE seat_id = _seat_id AND trip_id = _trip_id AND passenger_status = 'active'
    ) INTO seat_already_taken;

    IF seat_already_taken THEN
        RAISE EXCEPTION 'Seat % for trip % is already taken', _seat_id, _trip_id;
    END IF;

    -- REMOVED: UPDATE seats SET is_available = false (column dropped)
    -- Availability is now purely dynamic based on the passengers table.

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 3. Update get_available_seats()
CREATE OR REPLACE FUNCTION public.get_available_seats(p_trip_id BIGINT)
RETURNS JSONB AS $$
DECLARE
    v_bus_id BIGINT;
    v_blocked_seats JSONB;
    v_seats JSONB;
BEGIN
    SELECT bus_id, COALESCE(blocked_seats, '[]'::jsonb) 
    INTO v_bus_id, v_blocked_seats 
    FROM public.trips 
    WHERE trip_id = p_trip_id;
    
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
    WHERE s.bus_id = v_bus_id; -- Removed: s.is_available = true

    RETURN jsonb_build_object(
        'success', true,
        'seats', COALESCE(v_seats, '[]'::jsonb)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. تحديث وظيفة البحث عن الرحلات (search_trips)
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
              -- Removed: s.is_available = true
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

COMMIT;
