-- ========================================================
-- FIX SEAT LABELS AND FORCE SYNC
-- ========================================================

-- 1. Improved function to generate a default 40-seat layout with 1A, 1B... labels
CREATE OR REPLACE FUNCTION public.generate_default_bus_layout_v2()
RETURNS JSONB AS $$
DECLARE
    v_cells JSONB := '[]'::jsonb;
    v_rows INTEGER := 10;
    v_cols INTEGER := 4;
    v_col_labels TEXT[] := ARRAY['A', 'B', 'C', 'D'];
BEGIN
    FOR r IN 0..(v_rows - 1) LOOP
        FOR c IN 0..(v_cols - 1) LOOP
            v_cells := v_cells || jsonb_build_object(
                'id', r || '-' || c,
                'row', r,
                'col', c,
                'type', 'seat',
                'label', (r + 1) || v_col_labels[c + 1],
                'class', 'standard'
            );
        END LOOP;
    END LOOP;
    
    RETURN jsonb_build_object(
        'rows', v_rows,
        'cols', v_cols,
        'cells', v_cells
    );
END;
$$ LANGUAGE plpgsql;

-- 2. Update buses with the new default layout if they were using the old one or had none
-- We identify "old default" by checking if labels are just numbers
UPDATE public.buses
SET seat_layout = public.generate_default_bus_layout_v2()
WHERE seat_layout IS NULL 
   OR (seat_layout->'cells') IS NULL 
   OR jsonb_array_length(seat_layout->'cells') = 0
   OR (seat_layout->'cells'->0->>'label' ~ '^[0-9]+$'); -- If first seat label is just a number

-- 3. Robust Seat Sync Function (Directly populating the table to avoid trigger issues)
DO $$
DECLARE
    v_bus RECORD;
    v_cell RECORD;
    v_seat_numbers TEXT[];
BEGIN
    FOR v_bus IN SELECT * FROM public.buses LOOP
        IF v_bus.seat_layout IS NOT NULL AND (v_bus.seat_layout->'cells') IS NOT NULL THEN
            
            -- Collect all valid seat numbers from the layout
            SELECT array_agg(x->>'label')
            INTO v_seat_numbers
            FROM jsonb_array_elements(v_bus.seat_layout->'cells') AS x
            WHERE x->>'type' = 'seat' AND (x->>'label') IS NOT NULL;

            -- A. Deactivate seats not in the layout
            UPDATE public.seats
            SET is_available = false
            WHERE bus_id = v_bus.bus_id
              AND NOT (seat_number = ANY(v_seat_numbers));

            -- B. Insert or update seats
            FOR v_cell IN 
                SELECT 
                    x->>'label' as seat_number,
                    x->>'class' as seat_class
                FROM jsonb_array_elements(v_bus.seat_layout->'cells') AS x
                WHERE x->>'type' = 'seat' AND (x->>'label') IS NOT NULL
            LOOP
                INSERT INTO public.seats (bus_id, seat_number, price_adjustment_factor, is_available)
                VALUES (
                    v_bus.bus_id, 
                    v_cell.seat_number,
                    CASE WHEN v_cell.seat_class = 'vip' THEN 1.5 ELSE 1.0 END,
                    true
                )
                ON CONFLICT (bus_id, seat_number) DO UPDATE
                SET price_adjustment_factor = EXCLUDED.price_adjustment_factor,
                    is_available = true;
            END LOOP;
        END IF;
    END LOOP;
END $$;

-- 4. Cleanup
DROP FUNCTION IF EXISTS public.generate_default_bus_layout_v2();
