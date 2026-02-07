-- =============================================
-- Force Latest Booking to be Rateable
-- جعل آخر حجز مؤهلاً للتقييم (للأغراض التطويرية)
-- =============================================

DO $$
DECLARE
    v_booking_id BIGINT;
    v_trip_id BIGINT;
BEGIN
    -- 1. Get the most recent booking ID
    -- الحصول على أحدث رقم حجز
    SELECT booking_id, trip_id INTO v_booking_id, v_trip_id
    FROM public.bookings
    ORDER BY booking_id DESC
    LIMIT 1;
    
    IF v_booking_id IS NOT NULL THEN
        -- 2. Update Booking Status to 'completed'
        -- تحديث حالة الحجز إلى مكتمل
        UPDATE public.bookings 
        SET booking_status = 'completed' 
        WHERE booking_id = v_booking_id;
        
        -- 3. Update Trip Status to 'completed' and times to the past
        -- تحديث حالة الرحلة إلى مكتملة وتعديل الأوقات لتكون في الماضي
        UPDATE public.trips 
        SET status = 'completed', 
            arrival_time = NOW() - INTERVAL '2 hours', -- Arrived 2 hours ago
            departure_time = NOW() - INTERVAL '5 hours' -- Departed 5 hours ago
        WHERE trip_id = v_trip_id;
        
        -- 4. Delete any existing rating for this booking (to allow re-rating)
        -- حذف أي تقييم سابق لهذا الحجز للسماح بإعادة التقييم
        DELETE FROM public.ratings WHERE booking_id = v_booking_id;
        
        RAISE NOTICE 'SUCCESS: Booking % (Trip %) is now ready for rating.', v_booking_id, v_trip_id;
    ELSE
        RAISE NOTICE 'WARNING: No bookings found in the database.';
    END IF;
END $$;
