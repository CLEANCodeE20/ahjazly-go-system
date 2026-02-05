-- Function to get Partner Dashboard Summary stats
-- It uses get_current_partner_id() to automatically filter data for the logged-in partner/employee
CREATE OR REPLACE FUNCTION public.get_partner_analytics(
    start_date TIMESTAMPTZ DEFAULT (NOW() - INTERVAL '30 days'),
    end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    curr_partner_id INTEGER;
    result JSONB;
    total_rev NUMERIC;
    total_book INTEGER;
    trip_count INTEGER;
    completed_trip_count INTEGER;
    occupancy NUMERIC;
BEGIN
    -- Get current partner ID
    curr_partner_id := public.get_current_partner_id();

    -- Return empty if no partner_id linked (e.g. admin or unlinked user)
    -- Admin should use get_dashboard_stats or query views directly
    IF curr_partner_id IS NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
        RETURN jsonb_build_object('error', 'No partner access');
    END IF;

    -- Calculate revenue and bookings
    SELECT 
        COALESCE(SUM(total_price), 0),
        COUNT(booking_id)
    INTO total_rev, total_book
    FROM bookings
    JOIN trips ON bookings.trip_id = trips.trip_id
    WHERE (curr_partner_id IS NULL OR trips.partner_id = curr_partner_id) -- Admin can see all if they invoke this, or restricted to partner
    AND bookings.payment_status = 'paid'
    AND bookings.booking_date BETWEEN start_date AND end_date;

    -- Calculate trip stats
    SELECT 
        COUNT(trip_id),
        COUNT(trip_id) FILTER (WHERE status = 'completed')
    INTO trip_count, completed_trip_count
    FROM trips
    WHERE (curr_partner_id IS NULL OR partner_id = curr_partner_id)
    AND created_at BETWEEN start_date AND end_date;

    occupancy := CASE WHEN trip_count > 0 THEN ROUND((CAST(completed_trip_count AS NUMERIC) / trip_count) * 100, 2) ELSE 0 END;

    -- Build final JSON
    SELECT jsonb_build_object(
        'total_revenue', total_rev,
        'total_bookings', total_book,
        'total_trips', trip_count,
        'occupancy_rate', occupancy,
        'period_start', start_date,
        'period_end', end_date
    ) INTO result;

    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_partner_analytics TO authenticated;
