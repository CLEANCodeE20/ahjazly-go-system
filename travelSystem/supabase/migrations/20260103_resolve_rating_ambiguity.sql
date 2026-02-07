-- =============================================
-- RESOLVE RATING FUNCTION AMBIGUITY
-- حل تعارض أسماء دوال التقييم
-- =============================================

-- 1. Drop the ambiguous functions created recently (UUID versions with same name)
-- Note: We use DROP IF EXISTS with specific signature to avoid errors
DROP FUNCTION IF EXISTS public.create_rating(UUID, BIGINT, BIGINT, BIGINT, BIGINT, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, TEXT);
DROP FUNCTION IF EXISTS public.can_user_rate_trip(UUID, BIGINT, BIGINT);

-- 2. Create NEW functions with distinct names for UUID usage
-- This avoids PostgREST "Multiple Choices" error

CREATE OR REPLACE FUNCTION public.check_rating_eligibility(
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

    -- Call the original internal logic
    RETURN public.can_user_rate_trip(v_internal_user_id, p_trip_id, p_booking_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.check_rating_eligibility IS 'Check if user can rate a trip (accepts UUID to avoid overloading ambiguity)';


CREATE OR REPLACE FUNCTION public.submit_trip_rating(
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

    -- Call the original internal logic
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

COMMENT ON FUNCTION public.submit_trip_rating IS 'Submit a new trip rating (accepts UUID to avoid overloading ambiguity)';
