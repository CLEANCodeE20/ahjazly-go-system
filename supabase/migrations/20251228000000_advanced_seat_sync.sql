-- ========================================================
-- ADVANCED SEAT SYNCHRONIZATION LOGIC
-- ========================================================

-- 1. Function to synchronize seats from bus layout
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

        -- A. Deactivate seats not in the new layout
        UPDATE public.seats
        SET is_available = false
        WHERE bus_id = NEW.bus_id
          AND NOT (seat_number = ANY(v_seat_numbers));

        -- B. Insert or update existing seats from the layout
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
            SET price_adjustment_factor = EXCLUDED.price_adjustment_factor,
                is_available = true; -- Re-enable if it was disabled
        END LOOP;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Add unique constraint to prevent duplicate seats per bus
-- First, clean up duplicates if any (shouldn't be many in a fresh dev env)
DELETE FROM public.seats a USING public.seats b
WHERE a.seat_id < b.seat_id 
  AND a.bus_id = b.bus_id 
  AND a.seat_number = b.seat_number;

ALTER TABLE public.seats 
DROP CONSTRAINT IF EXISTS unique_bus_seat_number;

ALTER TABLE public.seats 
ADD CONSTRAINT unique_bus_seat_number UNIQUE (bus_id, seat_number);

-- 3. Create Trigger on Buses table
DROP TRIGGER IF EXISTS trigger_sync_bus_seats ON public.buses;
CREATE TRIGGER trigger_sync_bus_seats
AFTER INSERT OR UPDATE OF seat_layout ON public.buses
FOR EACH ROW
EXECUTE FUNCTION public.sync_bus_seats();

-- 4. Helper Function to apply template
CREATE OR REPLACE FUNCTION public.apply_bus_template(p_bus_id BIGINT, p_template_id BIGINT)
RETURNS JSONB AS $$
DECLARE
    v_layout JSONB;
    v_capacity INTEGER;
BEGIN
    SELECT seat_layout, capacity INTO v_layout, v_capacity 
    FROM public.bus_templates 
    WHERE template_id = p_template_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Template not found');
    END IF;
    
    UPDATE public.buses 
    SET seat_layout = v_layout,
        capacity = v_capacity,
        template_id = p_template_id
    WHERE bus_id = p_bus_id;
    
    RETURN jsonb_build_object('success', true, 'message', 'Template applied successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
