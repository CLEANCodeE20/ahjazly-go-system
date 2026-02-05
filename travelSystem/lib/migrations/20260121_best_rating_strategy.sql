-- =============================================
-- BEST RATING STRATEGY: TIME-FACT BASED ELIGIBILITY
-- =============================================

-- Update the core eligibility function
CREATE OR REPLACE FUNCTION public.can_user_rate_trip(
    p_user_id BIGINT,
    p_trip_id BIGINT,
    p_booking_id BIGINT
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.bookings b
        JOIN public.trips t ON b.trip_id = t.trip_id
        WHERE b.booking_id = p_booking_id
        AND b.user_id = p_user_id
        AND b.trip_id = p_trip_id
        -- 1. الحجز يجب أن يكون صالحاً (مؤكد أو مدفوع أو مكتمل)
        AND b.booking_status IN ('confirmed', 'paid', 'completed')
        -- 2. الرحلة يجب ألا تكون ملغاة
        AND t.status != 'cancelled'
        -- 3. الاستراتيجية النهائية: السماح بالتقييم إذا كانت الرحلة "مكتملة" 
        -- أو إذا مر وقت الوصول (مع هامش أمان كبير لفارق التوقيت)
        AND (
            t.status = 'completed' 
            OR COALESCE(t.arrival_time, t.departure_time + INTERVAL '4 hours') <= (NOW() + INTERVAL '6 hours')
        )
        -- 4. نافذة التقييم: خلال آخر 30 يوم من تاريخ الرحلة
        AND t.departure_time >= NOW() - INTERVAL '30 days'
        -- 5. منع التكرار: التأكد من عدم وجود تقييم سابق لهذا الحجز
        AND NOT EXISTS (
            SELECT 1 FROM public.ratings 
            WHERE booking_id = p_booking_id
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.can_user_rate_trip IS 'التحقق الذكي من أهلية المستخدم للتقييم بناءً على الحقائق الزمنية وحالة الحجز';
