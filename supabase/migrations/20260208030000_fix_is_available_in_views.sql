-- Fix remaining references to seats.is_available in views
-- The column was dropped but some views still reference it

-- Drop and recreate v_available_trips_for_search
DROP VIEW IF EXISTS v_available_trips_for_search CASCADE;

CREATE OR REPLACE VIEW v_available_trips_for_search AS
    SELECT 
        t.trip_id,
        t.partner_id,
        t.route_id,
        t.bus_id,
        t.driver_id,
        t.departure_time,
        t.arrival_time,
        t.base_price,
        t.status,
        r.origin_city,
        r.destination_city,
        bu.model,
        p.company_name,
        (
            (
                CASE 
                    WHEN EXISTS (SELECT 1 FROM public.seats s WHERE s.bus_id = t.bus_id) THEN
                        -- Count all seats for this bus (is_available column removed)
                        (SELECT COUNT(*) FROM public.seats s WHERE s.bus_id = t.bus_id)
                    ELSE 
                        COALESCE(bu.capacity, 0)
                END
            ) - 
            -- EXCLUDE ALL NON-CANCELLED PASSENGERS
            (SELECT COUNT(*) FROM public.passengers pass WHERE pass.trip_id = t.trip_id AND pass.passenger_status != 'cancelled') -
            (SELECT jsonb_array_length(COALESCE(t.blocked_seats, '[]'::jsonb)))
        ) AS available_seats,
        t.bus_id AS trip_bus_id,
        COALESCE(bu.seat_layout, '{}'::jsonb) AS seat_layout,
        t.linked_trip_id,
        t.status::VARCHAR AS trip_status
    FROM public.trips t
    LEFT JOIN public.routes r ON t.route_id = r.route_id
    LEFT JOIN public.buses bu ON t.bus_id = bu.bus_id
    LEFT JOIN public.partners p ON t.partner_id = p.partner_id
    WHERE t.status IN ('scheduled', 'in_progress')
    AND t.departure_time > NOW();

-- Drop and recreate v_trip_details_for_booking
DROP VIEW IF EXISTS v_trip_details_for_booking CASCADE;

CREATE OR REPLACE VIEW v_trip_details_for_booking AS
    SELECT 
        t.trip_id,
        t.partner_id,
        t.route_id,
        t.bus_id,
        t.driver_id,
        t.departure_time,
        t.arrival_time,
        t.base_price,
        t.status,
        r.origin_city,
        r.destination_city,
        bu.model,
        bu.license_plate,
        p.company_name,
        p.logo_url AS partner_logo,
        (
            (
                CASE 
                    WHEN EXISTS (SELECT 1 FROM public.seats s WHERE s.bus_id = t.bus_id) THEN
                        -- Count all seats for this bus (is_available column removed)
                        (SELECT COUNT(*) FROM public.seats s WHERE s.bus_id = t.bus_id)
                    ELSE 
                        COALESCE(bu.capacity, 0)
                END
            ) - 
            (SELECT COUNT(*) FROM public.passengers pass WHERE pass.trip_id = t.trip_id AND pass.passenger_status != 'cancelled') -
            (SELECT jsonb_array_length(COALESCE(t.blocked_seats, '[]'::jsonb)))
        ) AS available_seats,
        COALESCE(bu.seat_layout, '{}'::jsonb) AS seat_layout,
        t.linked_trip_id,
        t.cancel_policy_id,
        t.status::VARCHAR AS trip_status
    FROM public.trips t
    LEFT JOIN public.routes r ON t.route_id = r.route_id
    LEFT JOIN public.buses bu ON t.bus_id = bu.bus_id
    LEFT JOIN public.partners p ON t.partner_id = p.partner_id;

COMMENT ON VIEW v_available_trips_for_search IS 'Fixed view without is_available column reference';
COMMENT ON VIEW v_trip_details_for_booking IS 'Fixed view without is_available column reference';
