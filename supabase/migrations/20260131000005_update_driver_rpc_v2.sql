-- ==========================================================
-- GOLD STANDARD DRIVER RPCs (Phase 3.2: UUID Migration)
-- Date: 2026-01-31
-- Purpose: Updating Driver logic to use auth_id (UUID) directly
-- ==========================================================

BEGIN;

-- 1. Upgrade check_driver_trip_access
-- ==========================================================
CREATE OR REPLACE FUNCTION public.check_driver_trip_access(
    p_trip_id BIGINT,
    p_driver_id BIGINT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_driver_id BIGINT;
    v_trip_driver_id BIGINT;
BEGIN
    IF p_driver_id IS NULL THEN
        SELECT driver_id INTO v_driver_id
        FROM public.drivers
        WHERE auth_id = auth.uid() -- Straight join via UUID (Native Performance)
        LIMIT 1;
    ELSE
        v_driver_id := p_driver_id;
    END IF;

    SELECT driver_id INTO v_trip_driver_id
    FROM public.trips
    WHERE trip_id = p_trip_id;

    RETURN v_driver_id = v_trip_driver_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Upgrade update_trip_status_by_driver
-- ==========================================================
CREATE OR REPLACE FUNCTION public.update_trip_status_by_driver(
    p_trip_id BIGINT,
    p_new_status VARCHAR(50),
    p_location_lat NUMERIC(10,8) DEFAULT NULL,
    p_location_lng NUMERIC(11,8) DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_driver_id BIGINT;
    v_old_status VARCHAR(50);
BEGIN
    -- Resolve driver directly via auth_id
    SELECT d.driver_id INTO v_driver_id
    FROM public.drivers d
    WHERE d.auth_id = auth.uid()
    LIMIT 1;

    IF v_driver_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Driver not found');
    END IF;

    IF NOT public.check_driver_trip_access(p_trip_id, v_driver_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Trip not yours');
    END IF;

    SELECT status INTO v_old_status FROM public.trips WHERE trip_id = p_trip_id;

    UPDATE public.trips
    SET status = p_new_status::trip_status, updated_at = NOW()
    WHERE trip_id = p_trip_id;

    INSERT INTO public.trip_status_history (
        trip_id, driver_id, old_status, new_status,
        changed_by_auth_id, location_lat, location_lng, notes -- Note: We'll add changed_by_auth_id column later in purge
    ) VALUES (
        p_trip_id, v_driver_id, v_old_status, p_new_status,
        auth.uid(), p_location_lat, p_location_lng, p_notes
    );

    RETURN jsonb_build_object('success', true, 'trip_id', p_trip_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Upgrade get_driver_trips
-- ==========================================================
CREATE OR REPLACE FUNCTION public.get_driver_trips(
    p_start_date DATE DEFAULT CURRENT_DATE,
    p_end_date DATE DEFAULT CURRENT_DATE,
    p_status TEXT DEFAULT NULL
)
RETURNS TABLE (
    trip_id BIGINT,
    route_id BIGINT,
    bus_id BIGINT,
    departure_time TIMESTAMP,
    arrival_time TIMESTAMP,
    status VARCHAR(50),
    base_price NUMERIC(10,2),
    origin_city VARCHAR(100),
    destination_city VARCHAR(100),
    bus_license_plate VARCHAR(50),
    passenger_count BIGINT
) AS $$
DECLARE
    v_driver_id BIGINT;
BEGIN
    SELECT d.driver_id INTO v_driver_id
    FROM public.drivers d
    WHERE d.auth_id = auth.uid()
    LIMIT 1;

    IF v_driver_id IS NULL THEN
        RAISE EXCEPTION 'Driver account not found';
    END IF;

    RETURN QUERY
    SELECT 
        t.trip_id, t.route_id, t.bus_id, t.departure_time, t.arrival_time,
        t.status::VARCHAR(50), t.base_price, r.origin_city, r.destination_city,
        b.license_plate, COUNT(p.passenger_id)
    FROM public.trips t
    LEFT JOIN public.routes r ON t.route_id = r.route_id
    LEFT JOIN public.buses b ON t.bus_id = b.bus_id
    LEFT JOIN public.passengers p ON t.trip_id = p.trip_id
    WHERE t.driver_id = v_driver_id
        AND DATE(t.departure_time) BETWEEN p_start_date AND p_end_date
        AND (p_status IS NULL OR t.status::TEXT = p_status)
    GROUP BY t.trip_id, r.route_id, r.origin_city, r.destination_city, b.license_plate
    ORDER BY t.departure_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
