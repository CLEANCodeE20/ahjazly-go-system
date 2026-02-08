-- Script to populate missing seats for a bus based on its capacity
-- This should be run when "Seats Table Capacity" is less than "Generic Bus Capacity"

DO $$
DECLARE
    v_trip_id BIGINT := 25; 
    v_bus_id BIGINT;
    v_capacity INT;
    v_existing_seats INT;
    v_seats_to_add INT;
BEGIN
    -- 1. Get Bus Info
    SELECT t.bus_id, b.capacity 
    INTO v_bus_id, v_capacity
    FROM public.trips t
    JOIN public.buses b ON t.bus_id = b.bus_id
    WHERE t.trip_id = v_trip_id;

    IF v_bus_id IS NULL THEN
        RAISE NOTICE 'Trip not found.';
        RETURN;
    END IF;

    -- 2. Check Existing Seats
    SELECT COUNT(*) INTO v_existing_seats
    FROM public.seats
    WHERE bus_id = v_bus_id;

    RAISE NOTICE 'Bus ID: %, Capacity: %, Existing Seats: %', v_bus_id, v_capacity, v_existing_seats;

    -- 3. Add Missing Seats
    IF v_existing_seats < v_capacity THEN
        v_seats_to_add := v_capacity - v_existing_seats;
        RAISE NOTICE 'Adding % missing seats...', v_seats_to_add;

        -- Loop to add seats (simple numbering)
        -- Starts from existing count + 1 up to capacity
        INSERT INTO public.seats (bus_id, seat_number, price_adjustment_factor)
        SELECT 
            v_bus_id, 
            generate_series(v_existing_seats + 1, v_capacity)::TEXT,
            1.0 -- Default price factor
        ON CONFLICT (bus_id, seat_number) DO NOTHING;
        
        RAISE NOTICE 'Successfully added missing seats.';
    ELSE
        RAISE NOTICE 'No seats needed (Existing >= Capacity).';
    END IF;

END $$;
