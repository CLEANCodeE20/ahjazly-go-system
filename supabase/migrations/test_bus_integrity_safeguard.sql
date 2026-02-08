-- ========================================================
-- TEST: Bus Template Integrity Safeguard (Fixed Syntax)
-- ========================================================

BEGIN;

DO $$
DECLARE
    v_template_id BIGINT;
    v_bus_id BIGINT;
    v_seat_count INTEGER;
    v_layout JSONB;
    v_smart_result JSONB;
BEGIN
    -- 1. Create Template (داخل البلوك للتأكد من استخدام المتغير)
    INSERT INTO public.bus_templates (template_name, capacity, seat_layout)
    VALUES (
        'Test Template Integrity', 
        2, 
        '{"cells": [{"type": "seat", "label": "1A", "class": "standard"}, {"type": "seat", "label": "1B", "class": "vip"}]}'::jsonb
    )
    RETURNING template_id INTO v_template_id;

    RAISE NOTICE 'Created Template ID: %', v_template_id;

    -- 2. Create Bus using that template
    -- (نتأكد من استخدام الأعمدة الصحيحة: license_plate بدلاً من plate_number)
    INSERT INTO public.buses (license_plate, capacity, template_id, seat_layout, status)
    VALUES (
        'TEST-SAFEGUARD', 
        2, 
        v_template_id, 
        '{"cells": [{"type": "seat", "label": "1A", "class": "standard"}, {"type": "seat", "label": "1B", "class": "vip"}]}'::jsonb,
        'active'
    )
    RETURNING bus_id INTO v_bus_id;

    RAISE NOTICE 'Created Test Bus ID: % with Template ID: %', v_bus_id, v_template_id;

    -- 3. Verify Initial Seats (Trigger should have run on INSERT)
    SELECT count(*) INTO v_seat_count FROM public.seats WHERE bus_id = v_bus_id;
    RAISE NOTICE 'Initial Seat Count: % (Expected: 2)', v_seat_count;

    -- 4. ATTEMPT DATA CORRUPTION (Simulate bad frontend update)
    -- We send an empty cells array or just status updates without types
    RAISE NOTICE '--- Simulating BAD UPDATE (Empty cells) ---';
    
    UPDATE public.buses 
    SET seat_layout = '{"cells": []}'::jsonb 
    WHERE bus_id = v_bus_id;

    -- 5. Verify Result (Should have RESTORED from template)
    SELECT seat_layout INTO v_layout FROM public.buses WHERE bus_id = v_bus_id;
    SELECT count(*) INTO v_seat_count FROM public.seats WHERE bus_id = v_bus_id;

    IF v_seat_count = 2 THEN
        RAISE NOTICE '✓ SAFEGUARD SUCCESS: Seats preserved! Count: %', v_seat_count;
    ELSE
        RAISE NOTICE '✗ SAFEGUARD FAILED: Seats lost! Count: %', v_seat_count;
    END IF;

    -- 6. Test Smart Update Function
    RAISE NOTICE '--- Testing Smart Update Function ---';
    -- This function (created in previous step) merges changes
    -- We need to mock the array input properly if it expects text[]
    -- Note: We assume smart_update_bus_layout(bigint, text[]) exists from previous step
    
    PERFORM public.smart_update_bus_layout(v_bus_id, ARRAY['1A']);
    
    -- Check if 1A is now blocked
    -- We need to query the JSON to see if status='blocked' added
    SELECT seat_layout INTO v_layout FROM public.buses WHERE bus_id = v_bus_id;
    
    RAISE NOTICE 'Layout after smart update (Look for "status": "blocked"): %', v_layout;

END $$;

ROLLBACK; -- Always rollback test data
