-- ========================================================
-- ENSURE BUS LAYOUTS AND SYNC SEATS
-- ========================================================

-- 1. Function to generate a default 40-seat layout (4x10)
CREATE OR REPLACE FUNCTION public.generate_default_bus_layout()
RETURNS JSONB AS $$
DECLARE
    v_cells JSONB := '[]'::jsonb;
    v_rows INTEGER := 10;
    v_cols INTEGER := 4;
    v_seat_num INTEGER := 1;
BEGIN
    FOR r IN 0..(v_rows - 1) LOOP
        FOR c IN 0..(v_cols - 1) LOOP
            v_cells := v_cells || jsonb_build_object(
                'id', r || '-' || c,
                'row', r,
                'col', c,
                'type', 'seat',
                'label', v_seat_num::text,
                'class', 'standard'
            );
            v_seat_num := v_seat_num + 1;
        END LOOP;
    END LOOP;
    
    RETURN jsonb_build_object(
        'rows', v_rows,
        'cols', v_cols,
        'cells', v_cells
    );
END;
$$ LANGUAGE plpgsql;

-- 2. Update buses that don't have a layout
UPDATE public.buses
SET seat_layout = public.generate_default_bus_layout()
WHERE seat_layout IS NULL OR (seat_layout->'cells') IS NULL OR jsonb_array_length(seat_layout->'cells') = 0;

-- 3. Force sync seats for all buses to ensure the 'seats' table is populated
-- This uses the existing trigger function 'sync_bus_seats'
DO $$
DECLARE
    v_bus RECORD;
BEGIN
    FOR v_bus IN SELECT * FROM public.buses LOOP
        -- Trigger the sync by updating the layout with itself
        UPDATE public.buses 
        SET seat_layout = seat_layout 
        WHERE bus_id = v_bus.bus_id;
    END LOOP;
END $$;

-- 4. Cleanup helper function
DROP FUNCTION IF EXISTS public.generate_default_bus_layout();
