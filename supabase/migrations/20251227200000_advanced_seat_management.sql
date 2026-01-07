-- ========================================================
-- ADVANCED SEAT MANAGEMENT & INTERLINKING SYSTEM
-- ========================================================

-- 1. Create Bus Templates table
CREATE TABLE IF NOT EXISTS public.bus_templates (
    template_id BIGSERIAL PRIMARY KEY,
    partner_id BIGINT REFERENCES public.partners(partner_id) ON DELETE CASCADE,
    template_name VARCHAR(255) NOT NULL,
    capacity INTEGER NOT NULL,
    seat_layout JSONB NOT NULL, -- Stores the grid/coordinates
    bus_class_id BIGINT REFERENCES public.bus_classes(bus_class_id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Enhance Buses table
ALTER TABLE public.buses 
ADD COLUMN IF NOT EXISTS template_id BIGINT REFERENCES public.bus_templates(template_id),
ADD COLUMN IF NOT EXISTS seat_layout JSONB; -- Snapshot or custom layout

-- 3. Enhance Trips table for Interlinking
ALTER TABLE public.trips
ADD COLUMN IF NOT EXISTS linked_trip_id BIGINT REFERENCES public.trips(trip_id) ON DELETE SET NULL;

-- 4. Secure Atomic Seat Booking Function
-- This ensures no double booking occurs within a transaction
CREATE OR REPLACE FUNCTION public.secure_book_seat(
    _booking_id BIGINT,
    _seat_id BIGINT,
    _trip_id BIGINT
)
RETURNS BOOLEAN AS $$
DECLARE
    seat_already_taken BOOLEAN;
BEGIN
    -- Check if seat is still available
    SELECT EXISTS (
        SELECT 1 FROM public.passengers 
        WHERE seat_id = _seat_id AND trip_id = _trip_id
    ) INTO seat_already_taken;

    IF seat_already_taken THEN
        RAISE EXCEPTION 'Seat % for trip % is already taken', _seat_id, _trip_id;
    END IF;

    -- Update seat status if needed (if using a seats table)
    UPDATE public.seats 
    SET is_available = false 
    WHERE seat_id = _seat_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 5. Enable Real-time for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.passengers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.buses;

COMMIT;
