-- Daily Financial Summary BY PARTNER (Time-Series)
-- Allows partners to see their own daily performance without seeing global platform stats.

CREATE OR REPLACE VIEW public.daily_partner_financial_summary AS
SELECT 
    DATE(b.booking_date) as report_date,
    t.partner_id,
    p.company_name,
    COUNT(DISTINCT b.booking_id) as total_bookings,
    COUNT(DISTINCT CASE WHEN b.payment_status = 'paid' THEN b.booking_id END) as paid_bookings,
    COUNT(DISTINCT CASE WHEN b.booking_status = 'cancelled' THEN b.booking_id END) as cancelled_bookings,
    
    -- Revenue (Partner Perspective)
    COALESCE(SUM(CASE WHEN b.payment_status = 'paid' THEN b.total_price ELSE 0 END), 0) as gross_revenue,
    COALESCE(SUM(CASE WHEN b.payment_status = 'paid' THEN b.platform_commission ELSE 0 END), 0) as platform_commission,
    COALESCE(SUM(CASE WHEN b.payment_status = 'paid' THEN b.partner_revenue ELSE 0 END), 0) as partner_revenue, -- This is their Net
    
    -- Refunds
    COALESCE(SUM(CASE WHEN b.payment_status = 'refunded' THEN b.refund_amount ELSE 0 END), 0) as total_refunds,
    COALESCE(SUM(CASE WHEN b.payment_status = 'refunded' THEN b.cancellation_fee ELSE 0 END), 0) as cancellation_fees
    
FROM public.bookings b
JOIN public.trips t ON b.trip_id = t.trip_id
JOIN public.partners p ON t.partner_id = p.partner_id
GROUP BY DATE(b.booking_date), t.partner_id, p.company_name;

COMMENT ON VIEW public.daily_partner_financial_summary IS 'ملخص مالي يومي مفصل حسب الشريك';

GRANT SELECT ON public.daily_partner_financial_summary TO authenticated;
