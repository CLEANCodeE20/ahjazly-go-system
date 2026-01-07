-- =============================================
-- AUTO EXPIRE PENDING BOOKINGS
-- تنظيف الحجوزات المعلقة التي لم يتم دفعها
-- =============================================

CREATE OR REPLACE FUNCTION public.expire_pending_bookings()
RETURNS INTEGER AS $$
DECLARE
    v_expired_count INTEGER;
BEGIN
    -- 1. تحديث حالة الحجوزات المعلقة التي مر عليها أكثر من 30 دقيقة
    UPDATE public.bookings
    SET booking_status = 'expired'
    WHERE booking_status = 'pending'
    AND created_at < NOW() - INTERVAL '30 minutes';
    
    GET DIAGNOSTICS v_expired_count = ROW_COUNT;
    
    -- 2. تحديث حالة الركاب التابعين لهذه الحجوزات لضمان تحرير المقاعد
    -- (في دالة البحث، يتم استثناء الركاب الذين حالتهم ليست active)
    IF v_expired_count > 0 THEN
        UPDATE public.passengers
        SET passenger_status = 'cancelled'
        WHERE booking_id IN (
            SELECT booking_id FROM public.bookings WHERE booking_status = 'expired'
            AND updated_at >= NOW() - INTERVAL '1 minute' -- فقط التي تم تحديثها الآن
        );
    END IF;

    RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.expire_pending_bookings IS 
'تنظيف تلقائي للحجوزات المعلقة لأكثر من 30 دقيقة لتحرير المقاعد';

-- =============================================
-- إنشاء وظيفة للتحقق يدوياً أو عبر Cron
-- =============================================
SELECT public.expire_pending_bookings();
