-- =============================================
-- RATING SYSTEM FUNCTIONS AND PROCEDURES
-- دوال ونظام التقييم
-- =============================================

-- =============================================
-- FUNCTION 1: Check if user can rate a trip
-- التحقق من أهلية المستخدم للتقييم
-- =============================================

CREATE OR REPLACE FUNCTION public.can_user_rate_trip(
    p_user_id BIGINT,
    p_trip_id BIGINT,
    p_booking_id BIGINT
) RETURNS BOOLEAN AS $$
DECLARE
    v_can_rate BOOLEAN := FALSE;
BEGIN
    -- Check if:
    -- 1. Booking exists and belongs to user
    -- 2. Booking is for the specified trip
    -- 3. Booking status is completed
    -- 4. Trip status is completed
    -- 5. Trip has ended (arrival_time is in the past)
    -- 6. Trip ended within last 30 days (rating window)
    -- 7. No rating exists for this booking yet
    
    SELECT EXISTS (
        SELECT 1 
        FROM public.bookings b
        JOIN public.trips t ON b.trip_id = t.trip_id
        WHERE b.booking_id = p_booking_id
        AND b.user_id = p_user_id
        AND b.trip_id = p_trip_id
        AND b.booking_status = 'completed'
        AND t.status = 'completed'
        AND t.arrival_time <= NOW()
        AND t.arrival_time >= NOW() - INTERVAL '30 days'
        AND NOT EXISTS (
            SELECT 1 FROM public.ratings 
            WHERE booking_id = p_booking_id
        )
    ) INTO v_can_rate;
    
    RETURN v_can_rate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.can_user_rate_trip IS 'التحقق من أهلية المستخدم لتقييم رحلة معينة';

-- =============================================
-- FUNCTION 2: Get partner average rating
-- حساب متوسط تقييم الشريك
-- =============================================

CREATE OR REPLACE FUNCTION public.get_partner_average_rating(
    p_partner_id BIGINT
) RETURNS NUMERIC AS $$
BEGIN
    RETURN (
        SELECT ROUND(AVG(stars)::NUMERIC, 2)
        FROM public.ratings
        WHERE partner_id = p_partner_id
        AND is_visible = true
        AND is_verified = true
    );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.get_partner_average_rating IS 'حساب متوسط تقييم الشريك من التقييمات المرئية والموثقة';

-- =============================================
-- FUNCTION 3: Get driver average rating
-- حساب متوسط تقييم السائق
-- =============================================

CREATE OR REPLACE FUNCTION public.get_driver_average_rating(
    p_driver_id BIGINT
) RETURNS NUMERIC AS $$
BEGIN
    RETURN (
        SELECT ROUND(AVG(stars)::NUMERIC, 2)
        FROM public.ratings
        WHERE driver_id = p_driver_id
        AND is_visible = true
        AND is_verified = true
    );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.get_driver_average_rating IS 'حساب متوسط تقييم السائق من التقييمات المرئية والموثقة';

-- =============================================
-- FUNCTION 4: Get detailed partner rating stats
-- إحصائيات تفصيلية لتقييمات الشريك
-- =============================================

CREATE OR REPLACE FUNCTION public.get_partner_rating_stats(
    p_partner_id BIGINT
) RETURNS TABLE (
    total_ratings BIGINT,
    avg_overall NUMERIC,
    avg_service NUMERIC,
    avg_cleanliness NUMERIC,
    avg_punctuality NUMERIC,
    avg_comfort NUMERIC,
    avg_value NUMERIC,
    five_star_count BIGINT,
    four_star_count BIGINT,
    three_star_count BIGINT,
    two_star_count BIGINT,
    one_star_count BIGINT,
    positive_percentage NUMERIC,
    negative_percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(r.rating_id)::BIGINT as total_ratings,
        ROUND(AVG(r.stars)::NUMERIC, 2) as avg_overall,
        ROUND(AVG(r.service_rating)::NUMERIC, 2) as avg_service,
        ROUND(AVG(r.cleanliness_rating)::NUMERIC, 2) as avg_cleanliness,
        ROUND(AVG(r.punctuality_rating)::NUMERIC, 2) as avg_punctuality,
        ROUND(AVG(r.comfort_rating)::NUMERIC, 2) as avg_comfort,
        ROUND(AVG(r.value_for_money_rating)::NUMERIC, 2) as avg_value,
        COUNT(CASE WHEN r.stars = 5 THEN 1 END)::BIGINT as five_star_count,
        COUNT(CASE WHEN r.stars = 4 THEN 1 END)::BIGINT as four_star_count,
        COUNT(CASE WHEN r.stars = 3 THEN 1 END)::BIGINT as three_star_count,
        COUNT(CASE WHEN r.stars = 2 THEN 1 END)::BIGINT as two_star_count,
        COUNT(CASE WHEN r.stars = 1 THEN 1 END)::BIGINT as one_star_count,
        ROUND((COUNT(CASE WHEN r.stars >= 4 THEN 1 END)::NUMERIC / NULLIF(COUNT(r.rating_id), 0) * 100), 2) as positive_percentage,
        ROUND((COUNT(CASE WHEN r.stars <= 2 THEN 1 END)::NUMERIC / NULLIF(COUNT(r.rating_id), 0) * 100), 2) as negative_percentage
    FROM public.ratings r
    WHERE r.partner_id = p_partner_id
    AND r.is_visible = true
    AND r.is_verified = true;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.get_partner_rating_stats IS 'إحصائيات تفصيلية شاملة لتقييمات الشريك';

-- =============================================
-- FUNCTION 5: Get trip ratings with details
-- الحصول على تقييمات رحلة مع التفاصيل
-- =============================================

CREATE OR REPLACE FUNCTION public.get_trip_ratings(
    p_trip_id BIGINT,
    p_limit INTEGER DEFAULT 10,
    p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
    rating_id BIGINT,
    user_name VARCHAR,
    stars INTEGER,
    service_rating INTEGER,
    cleanliness_rating INTEGER,
    punctuality_rating INTEGER,
    comfort_rating INTEGER,
    value_for_money_rating INTEGER,
    comment TEXT,
    rating_date TIMESTAMP,
    helpful_count INTEGER,
    not_helpful_count INTEGER,
    has_response BOOLEAN,
    response_text TEXT,
    response_date TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.rating_id,
        u.full_name as user_name,
        r.stars,
        r.service_rating,
        r.cleanliness_rating,
        r.punctuality_rating,
        r.comfort_rating,
        r.value_for_money_rating,
        r.comment,
        r.rating_date,
        r.helpful_count,
        r.not_helpful_count,
        EXISTS(SELECT 1 FROM public.rating_responses rr WHERE rr.rating_id = r.rating_id) as has_response,
        rr.response_text,
        rr.created_at as response_date
    FROM public.ratings r
    JOIN public.users u ON r.user_id = u.user_id
    LEFT JOIN public.rating_responses rr ON r.rating_id = rr.rating_id AND rr.is_visible = true
    WHERE r.trip_id = p_trip_id
    AND r.is_visible = true
    ORDER BY r.rating_date DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.get_trip_ratings IS 'الحصول على تقييمات رحلة معينة مع التفاصيل والردود';

-- =============================================
-- FUNCTION 6: Create rating with validation
-- إنشاء تقييم مع التحقق من الصلاحيات
-- =============================================

CREATE OR REPLACE FUNCTION public.create_rating(
    p_user_id BIGINT,
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
    v_rating_id BIGINT;
    v_can_rate BOOLEAN;
BEGIN
    -- Check if user can rate this trip
    SELECT public.can_user_rate_trip(p_user_id, p_trip_id, p_booking_id)
    INTO v_can_rate;
    
    IF NOT v_can_rate THEN
        RAISE EXCEPTION 'User is not eligible to rate this trip';
    END IF;
    
    -- Insert rating
    INSERT INTO public.ratings (
        user_id,
        trip_id,
        booking_id,
        driver_id,
        partner_id,
        stars,
        service_rating,
        cleanliness_rating,
        punctuality_rating,
        comfort_rating,
        value_for_money_rating,
        comment
    ) VALUES (
        p_user_id,
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
    ) RETURNING rating_id INTO v_rating_id;
    
    RETURN v_rating_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.create_rating IS 'إنشاء تقييم جديد مع التحقق من صلاحية المستخدم';

-- =============================================
-- FUNCTION 7: Get ratings requiring attention
-- الحصول على التقييمات التي تحتاج متابعة
-- =============================================

CREATE OR REPLACE FUNCTION public.get_ratings_requiring_attention(
    p_partner_id BIGINT DEFAULT NULL
) RETURNS TABLE (
    rating_id BIGINT,
    trip_id BIGINT,
    partner_name VARCHAR,
    user_name VARCHAR,
    stars INTEGER,
    comment TEXT,
    rating_date TIMESTAMP,
    reported_count INTEGER,
    has_response BOOLEAN,
    days_since_rating INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.rating_id,
        r.trip_id,
        p.company_name as partner_name,
        u.full_name as user_name,
        r.stars,
        r.comment,
        r.rating_date,
        r.reported_count,
        EXISTS(SELECT 1 FROM public.rating_responses rr WHERE rr.rating_id = r.rating_id) as has_response,
        EXTRACT(DAY FROM NOW() - r.rating_date)::INTEGER as days_since_rating
    FROM public.ratings r
    JOIN public.users u ON r.user_id = u.user_id
    JOIN public.partners p ON r.partner_id = p.partner_id
    WHERE r.is_visible = true
    AND (
        r.stars <= 2 -- Low ratings
        OR r.reported_count > 0 -- Reported ratings
        OR (r.stars <= 3 AND NOT EXISTS(SELECT 1 FROM public.rating_responses rr WHERE rr.rating_id = r.rating_id)) -- Low ratings without response
    )
    AND (p_partner_id IS NULL OR r.partner_id = p_partner_id)
    ORDER BY 
        CASE WHEN r.reported_count > 0 THEN 1 ELSE 2 END, -- Reported first
        r.stars ASC, -- Lower ratings first
        r.rating_date DESC -- Recent first
    LIMIT 50;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.get_ratings_requiring_attention IS 'الحصول على التقييمات المنخفضة أو المبلغ عنها التي تحتاج متابعة';
