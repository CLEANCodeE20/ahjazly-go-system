CREATE OR REPLACE VIEW public.v_trip_metrics AS
SELECT
    t.trip_id,
    t.partner_id,
    COUNT(b.booking_id) FILTER (WHERE b.booking_status != 'cancelled') as confirmed_bookings,
    COUNT(b.booking_id) FILTER (WHERE b.booking_status = 'cancelled') as cancelled_bookings,
    COALESCE(SUM(b.total_price) FILTER (WHERE b.payment_status = 'paid'), 0) as collected_revenue,
    COALESCE(SUM(b.total_price) FILTER (WHERE b.payment_status = 'pending'), 0) as pending_revenue,
    COALESCE(SUM(b.partner_revenue) FILTER (WHERE b.payment_status = 'paid'), 0) as net_income
FROM trips t
LEFT JOIN bookings b ON t.trip_id = b.trip_id
GROUP BY t.trip_id, t.partner_id;

GRANT SELECT ON public.v_trip_metrics TO authenticated;
