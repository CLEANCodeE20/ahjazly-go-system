-- ========================================================
-- MASTER FIX FOR RLS POLICIES & TRIGGER PERMISSIONS
-- ========================================================

-- 1. Update trigger function to be SECURITY DEFINER
-- This allows the trigger to manage seats table even if the acting user has limited permissions
CREATE OR REPLACE FUNCTION public.sync_bus_seats()
RETURNS TRIGGER AS $$
DECLARE
    v_cell RECORD;
    v_seat_numbers TEXT[] := '{}';
BEGIN
    -- Only run if seat_layout has changed or it's a new bus
    IF (TG_OP = 'INSERT' AND NEW.seat_layout IS NOT NULL) OR 
       (TG_OP = 'UPDATE' AND OLD.seat_layout IS DISTINCT FROM NEW.seat_layout) THEN
        
        -- Safety check: Ensure seat_layout is an object and has cells
        IF jsonb_typeof(NEW.seat_layout) = 'object' AND NEW.seat_layout ? 'cells' AND jsonb_typeof(NEW.seat_layout->'cells') = 'array' THEN
            -- Collect all valid seat numbers from the layout cells
            SELECT array_agg(x->>'label')
            INTO v_seat_numbers
            FROM jsonb_array_elements(NEW.seat_layout->'cells') AS x
            WHERE x->>'type' = 'seat' AND (x->>'label') IS NOT NULL;
        END IF;

        -- Ensure v_seat_numbers is an array (even if empty) to avoid NULL logic issues
        v_seat_numbers := COALESCE(v_seat_numbers, '{}');

        -- A. Deactivate seats not in the new layout
        UPDATE public.seats
        SET is_available = false
        WHERE bus_id = NEW.bus_id
          AND NOT (seat_number = ANY(v_seat_numbers));

        -- B. Insert or update existing seats from the layout
        IF v_seat_numbers <> '{}' THEN
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
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- CRITICAL: Added SECURITY DEFINER

-- 2. FIX RLS POLICIES FOR ADMINS
-- Buses
DROP POLICY IF EXISTS "Partners can manage own buses" ON public.buses;
CREATE POLICY "Partners and Admins can manage buses" ON public.buses
    FOR ALL USING (partner_id = get_current_partner_id() OR has_role(auth.uid(), 'admin'))
    WITH CHECK (partner_id = get_current_partner_id() OR has_role(auth.uid(), 'admin'));

-- Drivers
DROP POLICY IF EXISTS "Partners can manage own drivers" ON public.drivers;
CREATE POLICY "Partners and Admins can manage drivers" ON public.drivers
    FOR ALL USING (partner_id = get_current_partner_id() OR has_role(auth.uid(), 'admin'))
    WITH CHECK (partner_id = get_current_partner_id() OR has_role(auth.uid(), 'admin'));

-- Trips
DROP POLICY IF EXISTS "Partners can manage own trips" ON public.trips;
CREATE POLICY "Partners and Admins can manage trips" ON public.trips
    FOR ALL USING (partner_id = get_current_partner_id() OR has_role(auth.uid(), 'admin'))
    WITH CHECK (partner_id = get_current_partner_id() OR has_role(auth.uid(), 'admin'));

-- Routes
DROP POLICY IF EXISTS "Partners can manage own routes" ON public.routes;
CREATE POLICY "Partners and Admins can manage routes" ON public.routes
    FOR ALL USING (partner_id = get_current_partner_id() OR partner_id IS NULL OR has_role(auth.uid(), 'admin'))
    WITH CHECK (partner_id = get_current_partner_id() OR partner_id IS NULL OR has_role(auth.uid(), 'admin'));

-- Seats (Missing Policies)
DROP POLICY IF EXISTS "Partners and Admins can manage seats" ON public.seats;
CREATE POLICY "Partners and Admins can manage seats" ON public.seats
    FOR ALL USING (
        bus_id IN (SELECT bus_id FROM public.buses WHERE partner_id = get_current_partner_id())
        OR has_role(auth.uid(), 'admin')
    )
    WITH CHECK (
        bus_id IN (SELECT bus_id FROM public.buses WHERE partner_id = get_current_partner_id())
        OR has_role(auth.uid(), 'admin')
    );
