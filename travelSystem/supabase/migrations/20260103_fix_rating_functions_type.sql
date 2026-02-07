-- =============================================
-- FIX RATING FUNCTIONS TYPE MISMATCH
-- إصلاح عدم تطابق أنواع البيانات في دوال التقييم
-- =============================================

-- 1. Overload can_user_rate_trip to accept UUID
CREATE OR REPLACE FUNCTION public.can_user_rate_trip(
    p_user_id UUID,
    p_trip_id BIGINT,
    p_booking_id BIGINT
) RETURNS BOOLEAN AS $$
DECLARE
    v_internal_user_id BIGINT;
BEGIN
    -- Get internal user_id
    SELECT user_id INTO v_internal_user_id
    FROM public.users
    WHERE auth_id = p_user_id;

    IF v_internal_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Call the original function with BIGINT
    RETURN public.can_user_rate_trip(v_internal_user_id, p_trip_id, p_booking_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.can_user_rate_trip(UUID, BIGINT, BIGINT) IS 'نسخة من دالة التحقق تقبل معرف المستخدم بنظام المصادقة (UUID)';

-- 2. Overload create_rating to accept UUID
CREATE OR REPLACE FUNCTION public.create_rating(
    p_user_id UUID,
    p_trip_id BIGINT,
    p_booking_id BIGINT,
    p_driver_id BIGINT,
    p_partner_id BIGINT,
    p_stars INTEGER,
    p_service_rating INTEGER DEFAULT NULL,
    p_cleanliness_rating INTEGER DEFAULT NULL,
    p_punctuality_rating INTEGER DEFAULT NULL,
    p_comfort_rating INTEGER DEFAULT NULL,
    p_value_for_money_rating INTEGER DEFAULT NULL,
    p_comment TEXT DEFAULT NULL
) RETURNS BIGINT AS $$
DECLARE
    v_internal_user_id BIGINT;
BEGIN
    -- Get internal user_id
    SELECT user_id INTO v_internal_user_id
    FROM public.users
    WHERE auth_id = p_user_id;

    IF v_internal_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    -- Call the original function with BIGINT
    RETURN public.create_rating(
        v_internal_user_id,
        p_trip_id,
        p_booking_id,
        p_driver_id,
        p_partner_id,
        p_stars,
        p_service_rating,
        p_cleanliness_rating,
        p_punctuality_rating,
        p_comfort_rating,
        p_value_for_money_rating,
        p_comment
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.create_rating(UUID, BIGINT, BIGINT, BIGINT, BIGINT, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, TEXT) IS 'نسخة من دالة إنشاء التقييم تقبل معرف المستخدم بنظام المصادقة (UUID)';
