-- Create Daily Revenue View
CREATE OR REPLACE VIEW public.analytics_daily_revenue AS
SELECT 
    DATE(booking_date) as date,
    SUM(total_price) as total_revenue,
    SUM(platform_commission) as platform_revenue,
    SUM(partner_revenue) as partner_revenue,
    COUNT(booking_id) as bookings_count,
    COUNT(DISTINCT trips.partner_id) as active_partners
FROM bookings
LEFT JOIN trips ON bookings.trip_id = trips.trip_id
WHERE payment_status = 'paid'
GROUP BY DATE(booking_date);

-- Create Top Partners View
CREATE OR REPLACE VIEW public.analytics_partner_performance AS
SELECT 
    partners.partner_id,
    partners.company_name,
    COUNT(bookings.booking_id) as total_bookings,
    SUM(bookings.total_price) as total_revenue,
    SUM(bookings.platform_commission) as total_commission,
    SUM(bookings.partner_revenue) as net_revenue,
    AVG(bookings.total_price) as avg_booking_value
FROM partners
JOIN trips ON partners.partner_id = trips.partner_id
JOIN bookings ON trips.trip_id = bookings.trip_id
WHERE bookings.payment_status = 'paid'
GROUP BY partners.partner_id, partners.company_name;

-- Create Route Performance View
CREATE OR REPLACE VIEW public.analytics_route_performance AS
SELECT 
    routes.route_id,
    routes.origin_city,
    routes.destination_city,
    COUNT(trips.trip_id) as total_trips,
    COUNT(bookings.booking_id) as total_bookings,
    SUM(bookings.total_price) as total_revenue,
    ROUND(CAST(COUNT(bookings.booking_id) AS NUMERIC) / NULLIF(COUNT(trips.trip_id), 0), 2) as avg_bookings_per_trip
FROM routes
LEFT JOIN trips ON routes.route_id = trips.route_id
LEFT JOIN bookings ON trips.trip_id = bookings.trip_id
GROUP BY routes.route_id, routes.origin_city, routes.destination_city;

-- Function to get Dashboard Summary stats in one call
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(
    start_date TIMESTAMPTZ DEFAULT (NOW() - INTERVAL '30 days'),
    end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_revenue', COALESCE(SUM(total_price), 0),
        'total_bookings', COUNT(booking_id),
        'avg_booking_value', COALESCE(ROUND(AVG(total_price), 2), 0),
        'platform_revenue', COALESCE(SUM(platform_commission), 0)
    ) INTO result
    FROM bookings
    WHERE payment_status = 'paid'
    AND booking_date BETWEEN start_date AND end_date;

    RETURN result;
END;
$$;

-- Grant permissions
GRANT SELECT ON public.analytics_daily_revenue TO authenticated;
GRANT SELECT ON public.analytics_partner_performance TO authenticated;
GRANT SELECT ON public.analytics_route_performance TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats TO authenticated;
