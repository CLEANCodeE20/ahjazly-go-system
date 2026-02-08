-- Modified script to return results as a table
-- Replace 'v_trip_id' with your trip ID

WITH trip_stats AS (
    SELECT 
        25 AS trip_id, -- TRIP ID
        COALESCE(b.capacity, 0) AS generic_bus_capacity,
        (
            SELECT COUNT(*) 
            FROM public.seats s 
            WHERE s.bus_id = t.bus_id
        ) AS current_seats_table_count,
        (
            SELECT COUNT(*) 
            FROM public.passengers p 
            WHERE p.trip_id = t.trip_id 
            AND p.passenger_status NOT IN ('cancelled', 'refunded')
        ) AS active_bookings_count,
        (
            SELECT COALESCE(jsonb_array_length(t.blocked_seats), 0)
        ) AS blocked_seats_count
    FROM public.trips t
    LEFT JOIN public.buses b ON t.bus_id = b.bus_id
    WHERE t.trip_id = 25 -- TRIP ID
)
SELECT 
    trip_id,
    generic_bus_capacity,
    current_seats_table_count,
    active_bookings_count,
    blocked_seats_count,
    (
        CASE 
            WHEN current_seats_table_count > 0 THEN current_seats_table_count 
            ELSE generic_bus_capacity 
        END 
        - active_bookings_count 
        - blocked_seats_count
    ) AS calculated_available_seats,
    CASE 
        WHEN current_seats_table_count > 0 THEN 'USING_SEATS_TABLE (Capacity = ' || current_seats_table_count || ')'
        ELSE 'USING_GENERIC_CAPACITY (Capacity = ' || generic_bus_capacity || ')'
    END AS calculation_method
FROM trip_stats;
