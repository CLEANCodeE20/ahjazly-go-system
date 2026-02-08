-- ========================================================
-- TEST V2: Bus Template Integrity Safeguard (Compatible)
-- ========================================================

BEGIN;

DO $$
DECLARE
    v_template_id BIGINT;
    v_bus_id BIGINT;
    v_seat_count INTEGER;
    v_layout JSONB;
BEGIN
    -- 1. Create Template
    INSERT INTO public.bus_templates (template_name, capacity, seat_layout)
    VALUES (
        'Test Template V2', 
        2, 
        '{"cells": [{"type": "seat", "label": "1A", "class": "standard"}, {"type": "seat", "label": "1B", "class": "vip"}]}'::jsonb
    )
    RETURNING template_id INTO v_template_id;

    -- 2. Create Bus using that template
    INSERT INTO public.buses (license_plate, capacity, template_id, seat_layout, status)
    VALUES (
        'TEST-SAFEGUARD-V2', 
        2, 
        v_template_id, 
        '{"cells": [{"type": "seat", "label": "1A", "class": "standard"}, {"type": "seat", "label": "1B", "class": "vip"}]}'::jsonb,
        'active'
    )
    RETURNING bus_id INTO v_bus_id;

    RAISE NOTICE 'Created Test Bus % with Template %', v_bus_id, v_template_id;

    -- 3. Verify Initial Seats
    SELECT count(*) INTO v_seat_count FROM public.seats WHERE bus_id = v_bus_id;
    RAISE NOTICE 'Initial Seat Count: % (Expected: 2)', v_seat_count;

    -- 4. ATTEMPT DATA CORRUPTION (The main test)
    RAISE NOTICE '--- Simulating BAD UPDATE (Empty cells) ---';
    
    UPDATE public.buses 
    SET seat_layout = '{"cells": []}'::jsonb 
    WHERE bus_id = v_bus_id;

    -- 5. Verify Safeguard Result
    SELECT count(*) INTO v_seat_count FROM public.seats WHERE bus_id = v_bus_id;

    IF v_seat_count = 2 THEN
        RAISE NOTICE '✓ SAFEGUARD SUCCESS: Seats preserved! Count: %', v_seat_count;
    ELSE
        RAISE NOTICE '✗ SAFEGUARD FAILED: Seats lost! Count: %', v_seat_count;
    END IF;

    -- 6. Test Smart Update Function
    RAISE NOTICE '--- Testing Smart Update (Blocking 1A) ---';
    
    -- This should BLOCK seat 1A -> Trigger logic should DELETE it from seats table
    PERFORM public.smart_update_bus_layout(v_bus_id, ARRAY['1A']);
    
    -- Check seat count (Should be 1 now, because 1A is removed/blocked)
    SELECT count(*) INTO v_seat_count FROM public.seats WHERE bus_id = v_bus_id;
    
    IF v_seat_count = 1 THEN
        RAISE NOTICE '✓ SMART UPDATE SUCCESS: Seat blocked (removed from table). Count: %', v_seat_count;
    ELSE
        RAISE NOTICE '✗ SMART UPDATE FAILED: Unexpected seat count: %', v_seat_count;
    END IF;

    -- Verify JSON structure is still intact (contains coordinates/types)
    SELECT seat_layout INTO v_layout FROM public.buses WHERE bus_id = v_bus_id;
    RAISE NOTICE 'Final Layout Sample: %', v_layout;

END $$;

ROLLBACK; -- Clean up
