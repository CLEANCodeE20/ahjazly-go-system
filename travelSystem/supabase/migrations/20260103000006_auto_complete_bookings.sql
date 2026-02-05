-- =============================================
-- AUTO COMPLETE BOOKINGS ON TRIP COMPLETION
-- أتمتة إكمال الحجوزات عند اكتمال الرحلة
-- =============================================

-- 1. Create the function that performs the update
CREATE OR REPLACE FUNCTION public.auto_complete_trip_bookings()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger if status changed to 'completed'
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        
        -- Update all confirmed bookings for this trip to 'completed'
        UPDATE public.bookings
        SET 
            booking_status = 'completed'
        WHERE trip_id = NEW.trip_id
        -- ✅ FIX: Removed 'paid' from booking_status check as it's not a valid enum value
        -- Only 'confirmed' bookings should be auto-completed. 
        -- 'pending' bookings should likely expire or be handled separately.
        AND booking_status = 'confirmed'; 
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger on trips table
DROP TRIGGER IF EXISTS auto_complete_bookings_on_trip_completion ON public.trips;

CREATE TRIGGER auto_complete_bookings_on_trip_completion
    AFTER UPDATE ON public.trips
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_complete_trip_bookings();

-- 3. Utility function for manual fix if needed
DROP FUNCTION IF EXISTS public.complete_trip_with_bookings(BIGINT);

CREATE OR REPLACE FUNCTION public.complete_trip_with_bookings(p_trip_id BIGINT)
RETURNS JSONB AS $$
DECLARE
    v_updated_count INT;
BEGIN
    -- 1. Update Trip
    UPDATE public.trips 
    SET status = 'completed' 
    WHERE trip_id = p_trip_id;
    
    -- 2. Update Bookings (Corrected Logic)
    UPDATE public.bookings
    SET booking_status = 'completed'
    WHERE trip_id = p_trip_id 
    AND booking_status = 'confirmed';
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    RETURN jsonb_build_object(
        'success', true,
        'trip_id', p_trip_id,
        'bookings_updated', v_updated_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
