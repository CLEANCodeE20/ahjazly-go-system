-- =============================================
-- RATING SYSTEM ANALYTICS VIEWS
-- عروض التحليلات والإحصائيات لنظام التقييم
-- =============================================

-- =============================================
-- VIEW 1: Partner Rating Statistics
-- إحصائيات تقييمات الشركاء
-- =============================================

CREATE OR REPLACE VIEW public.v_partner_rating_stats AS
SELECT 
    p.partner_id,
    p.company_name,
    p.status as partner_status,
    COUNT(r.rating_id) as total_ratings,
    ROUND(AVG(r.stars)::NUMERIC, 2) as avg_overall_rating,
    ROUND(AVG(r.service_rating)::NUMERIC, 2) as avg_service_rating,
    ROUND(AVG(r.cleanliness_rating)::NUMERIC, 2) as avg_cleanliness_rating,
    ROUND(AVG(r.punctuality_rating)::NUMERIC, 2) as avg_punctuality_rating,
    ROUND(AVG(r.comfort_rating)::NUMERIC, 2) as avg_comfort_rating,
    ROUND(AVG(r.value_for_money_rating)::NUMERIC, 2) as avg_value_rating,
    COUNT(CASE WHEN r.stars = 5 THEN 1 END) as five_star_count,
    COUNT(CASE WHEN r.stars = 4 THEN 1 END) as four_star_count,
    COUNT(CASE WHEN r.stars = 3 THEN 1 END) as three_star_count,
    COUNT(CASE WHEN r.stars = 2 THEN 1 END) as two_star_count,
    COUNT(CASE WHEN r.stars = 1 THEN 1 END) as one_star_count,
    COUNT(CASE WHEN r.stars >= 4 THEN 1 END) as positive_ratings,
    COUNT(CASE WHEN r.stars <= 2 THEN 1 END) as negative_ratings,
    ROUND((COUNT(CASE WHEN r.stars >= 4 THEN 1 END)::NUMERIC / NULLIF(COUNT(r.rating_id), 0) * 100), 2) as positive_percentage,
    ROUND((COUNT(CASE WHEN r.stars <= 2 THEN 1 END)::NUMERIC / NULLIF(COUNT(r.rating_id), 0) * 100), 2) as negative_percentage,
    COUNT(CASE WHEN r.comment IS NOT NULL AND r.comment != '' THEN 1 END) as ratings_with_comments,
    SUM(r.helpful_count) as total_helpful_votes,
    COUNT(CASE WHEN EXISTS(SELECT 1 FROM rating_responses rr WHERE rr.rating_id = r.rating_id) THEN 1 END) as ratings_with_responses,
    MAX(r.rating_date) as last_rating_date
FROM public.partners p
LEFT JOIN public.ratings r ON p.partner_id = r.partner_id 
    AND r.is_visible = true 
    AND r.is_verified = true
GROUP BY p.partner_id, p.company_name, p.status;

COMMENT ON VIEW public.v_partner_rating_stats IS 'إحصائيات شاملة لتقييمات جميع الشركاء';

-- =============================================
-- VIEW 2: Driver Rating Statistics
-- إحصائيات تقييمات السائقين
-- =============================================

CREATE OR REPLACE VIEW public.v_driver_rating_stats AS
SELECT 
    d.driver_id,
    d.full_name as driver_name,
    d.partner_id,
    p.company_name as partner_name,
    d.status as driver_status,
    COUNT(r.rating_id) as total_ratings,
    ROUND(AVG(r.stars)::NUMERIC, 2) as avg_rating,
    COUNT(CASE WHEN r.stars >= 4 THEN 1 END) as positive_ratings,
    COUNT(CASE WHEN r.stars <= 2 THEN 1 END) as negative_ratings,
    ROUND((COUNT(CASE WHEN r.stars >= 4 THEN 1 END)::NUMERIC / NULLIF(COUNT(r.rating_id), 0) * 100), 2) as positive_percentage,
    MAX(r.rating_date) as last_rating_date
FROM public.drivers d
LEFT JOIN public.partners p ON d.partner_id = p.partner_id
LEFT JOIN public.ratings r ON d.driver_id = r.driver_id 
    AND r.is_visible = true 
    AND r.is_verified = true
GROUP BY d.driver_id, d.full_name, d.partner_id, p.company_name, d.status;

COMMENT ON VIEW public.v_driver_rating_stats IS 'إحصائيات تقييمات جميع السائقين';

-- =============================================
-- VIEW 3: Top Rated Partners
-- أفضل الشركاء تقييماً
-- =============================================

CREATE OR REPLACE VIEW public.v_top_rated_partners AS
SELECT 
    partner_id,
    company_name,
    total_ratings,
    avg_overall_rating,
    positive_percentage,
    last_rating_date
FROM public.v_partner_rating_stats
WHERE total_ratings >= 5 -- Minimum 5 ratings to be considered
ORDER BY avg_overall_rating DESC, total_ratings DESC
LIMIT 20;

COMMENT ON VIEW public.v_top_rated_partners IS 'أفضل 20 شريك من حيث التقييم';

-- =============================================
-- VIEW 4: Recent Ratings
-- التقييمات الأخيرة
-- =============================================

CREATE OR REPLACE VIEW public.v_recent_ratings AS
SELECT 
    r.rating_id,
    r.rating_date,
    u.full_name as user_name,
    p.company_name as partner_name,
    d.full_name as driver_name,
    t.trip_id,
    ro.origin_city || ' - ' || ro.destination_city as route,
    r.stars,
    r.service_rating,
    r.cleanliness_rating,
    r.punctuality_rating,
    r.comfort_rating,
    r.value_for_money_rating,
    r.comment,
    r.helpful_count,
    r.not_helpful_count,
    r.reported_count,
    r.is_verified,
    EXISTS(SELECT 1 FROM public.rating_responses rr WHERE rr.rating_id = r.rating_id) as has_response
FROM public.ratings r
JOIN public.users u ON r.user_id = u.user_id
JOIN public.partners p ON r.partner_id = p.partner_id
LEFT JOIN public.drivers d ON r.driver_id = d.driver_id
JOIN public.trips t ON r.trip_id = t.trip_id
JOIN public.routes ro ON t.route_id = ro.route_id
WHERE r.is_visible = true
ORDER BY r.rating_date DESC
LIMIT 100;

COMMENT ON VIEW public.v_recent_ratings IS 'آخر 100 تقييم في النظام';

-- =============================================
-- VIEW 5: Low Ratings Requiring Attention
-- التقييمات المنخفضة التي تحتاج متابعة
-- =============================================

CREATE OR REPLACE VIEW public.v_ratings_requiring_attention AS
SELECT 
    r.rating_id,
    r.rating_date,
    EXTRACT(DAY FROM NOW() - r.rating_date)::INTEGER as days_since_rating,
    u.full_name as user_name,
    p.partner_id,
    p.company_name as partner_name,
    d.full_name as driver_name,
    t.trip_id,
    ro.origin_city || ' - ' || ro.destination_city as route,
    r.stars,
    r.comment,
    r.reported_count,
    EXISTS(SELECT 1 FROM public.rating_responses rr WHERE rr.rating_id = r.rating_id) as has_response,
    CASE 
        WHEN r.reported_count > 0 THEN 'reported'
        WHEN r.stars <= 2 THEN 'very_low'
        WHEN r.stars = 3 THEN 'low'
        ELSE 'normal'
    END as priority_level
FROM public.ratings r
JOIN public.users u ON r.user_id = u.user_id
JOIN public.partners p ON r.partner_id = p.partner_id
LEFT JOIN public.drivers d ON r.driver_id = d.driver_id
JOIN public.trips t ON r.trip_id = t.trip_id
JOIN public.routes ro ON t.route_id = ro.route_id
WHERE r.is_visible = true
AND (
    r.stars <= 3 
    OR r.reported_count > 0
    OR (r.stars <= 3 AND NOT EXISTS(SELECT 1 FROM public.rating_responses rr WHERE rr.rating_id = r.rating_id))
)
ORDER BY 
    CASE WHEN r.reported_count > 0 THEN 1 ELSE 2 END,
    r.stars ASC,
    r.rating_date DESC;

COMMENT ON VIEW public.v_ratings_requiring_attention IS 'التقييمات المنخفضة أو المبلغ عنها التي تحتاج متابعة من الإدارة أو الشركاء';

-- =============================================
-- VIEW 6: Rating Trends Over Time
-- اتجاهات التقييمات عبر الزمن
-- =============================================

CREATE OR REPLACE VIEW public.v_rating_trends_monthly AS
SELECT 
    DATE_TRUNC('month', r.rating_date) as month,
    p.partner_id,
    p.company_name,
    COUNT(r.rating_id) as total_ratings,
    ROUND(AVG(r.stars)::NUMERIC, 2) as avg_rating,
    COUNT(CASE WHEN r.stars >= 4 THEN 1 END) as positive_ratings,
    COUNT(CASE WHEN r.stars <= 2 THEN 1 END) as negative_ratings
FROM public.ratings r
JOIN public.partners p ON r.partner_id = p.partner_id
WHERE r.is_visible = true 
AND r.is_verified = true
AND r.rating_date >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', r.rating_date), p.partner_id, p.company_name
ORDER BY month DESC, avg_rating DESC;

COMMENT ON VIEW public.v_rating_trends_monthly IS 'اتجاهات التقييمات الشهرية للشركاء خلال آخر 12 شهر';

-- =============================================
-- VIEW 7: Detailed Rating with All Relations
-- تقييم مفصل مع جميع العلاقات
-- =============================================

CREATE OR REPLACE VIEW public.v_rating_details AS
SELECT 
    r.rating_id,
    r.rating_date,
    r.updated_at,
    -- User info
    r.user_id,
    u.full_name as user_name,
    u.email as user_email,
    u.phone_number as user_phone,
    -- Booking info
    r.booking_id,
    b.booking_date,
    b.booking_status,
    -- Trip info
    r.trip_id,
    t.departure_time,
    t.arrival_time,
    ro.origin_city,
    ro.destination_city,
    -- Partner info
    r.partner_id,
    p.company_name as partner_name,
    -- Driver info
    r.driver_id,
    d.full_name as driver_name,
    -- Rating details
    r.stars as overall_rating,
    r.service_rating,
    r.cleanliness_rating,
    r.punctuality_rating,
    r.comfort_rating,
    r.value_for_money_rating,
    r.comment,
    -- Status and counts
    r.is_verified,
    r.is_visible,
    r.helpful_count,
    r.not_helpful_count,
    r.reported_count,
    r.admin_notes,
    -- Response info
    EXISTS(SELECT 1 FROM public.rating_responses rr WHERE rr.rating_id = r.rating_id) as has_response,
    (SELECT response_text FROM public.rating_responses rr WHERE rr.rating_id = r.rating_id AND rr.is_visible = true LIMIT 1) as response_text,
    (SELECT created_at FROM public.rating_responses rr WHERE rr.rating_id = r.rating_id AND rr.is_visible = true LIMIT 1) as response_date
FROM public.ratings r
JOIN public.users u ON r.user_id = u.user_id
LEFT JOIN public.bookings b ON r.booking_id = b.booking_id
JOIN public.trips t ON r.trip_id = t.trip_id
JOIN public.routes ro ON t.route_id = ro.route_id
JOIN public.partners p ON r.partner_id = p.partner_id
LEFT JOIN public.drivers d ON r.driver_id = d.driver_id;

COMMENT ON VIEW public.v_rating_details IS 'تفاصيل كاملة للتقييمات مع جميع العلاقات';
