-- =============================================
-- AUTOMATIC PASSENGER STATUS SYNC
-- مزامنة تلقائية لحالة الركاب مع حالة الحجز
-- =============================================

CREATE OR REPLACE FUNCTION public.fn_sync_passenger_status_with_booking()
RETURNS TRIGGER AS $$
BEGIN
    -- If booking is cancelled, rejected, or expired, sync passengers to 'cancelled'
    IF (NEW.booking_status::TEXT IN ('cancelled', 'rejected', 'expired')) 
       AND (OLD.booking_status::TEXT != NEW.booking_status::TEXT) THEN
       
        UPDATE public.passengers 
        SET passenger_status = 'cancelled'
        WHERE booking_id = NEW.booking_id;
        
    END IF;

    -- If booking is restored to pending/confirmed (rare but possible), sync back to 'active'
    IF (NEW.booking_status::TEXT IN ('pending', 'confirmed', 'completed')) 
       AND (OLD.booking_status::TEXT IN ('cancelled', 'rejected', 'expired')) THEN
       
        UPDATE public.passengers 
        SET passenger_status = 'active'
        WHERE booking_id = NEW.booking_id;
        
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup
DROP TRIGGER IF EXISTS tr_sync_passengers_on_booking_update ON public.bookings;

-- Create Trigger
CREATE TRIGGER tr_sync_passengers_on_booking_update
AFTER UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.fn_sync_passenger_status_with_booking();

COMMENT ON FUNCTION public.fn_sync_passenger_status_with_booking IS 
'يضمن تحرير المقاعد (تغيير حالة الركاب) تلقائياً عند إلغاء أو رفض الحجز';
