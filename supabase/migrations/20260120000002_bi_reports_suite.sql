-- ========================================================
-- BI REPORTS SUITE (THE BEST STRATEGY)
-- ========================================================
-- Purpose:
-- Provide a comprehensive, secure, and high-performance reporting layer.
-- 1. reports_trips_operations: Real-time operational data.
-- 2. reports_booking_management: 360-degree customer & booking view.
-- 3. reports_financial_transactions: Double-entry financial tracking.
-- 4. reports_refund_processing: SLA & status tracking for refunds.
-- 5. reports_executive_summary: High-level KPIs for decision making.
--
-- Security:
-- All views use `security_invoker=true` to enforce RLS policies of the querying user.
-- ========================================================

BEGIN;

-- ========================================================
-- 1. REPORTS: TRIPS OPERATIONS (Operational Layer)
-- ========================================================
CREATE OR REPLACE VIEW public.reports_trips_operations WITH (security_invoker=true) AS
SELECT 
    t.trip_id,
    t.partner_id,
    p.company_name,
    t.status as trip_status,
    
    -- Route Details
    r.route_id,
    r.origin_city,
    r.destination_city,
    
    -- Schedule
    t.departure_time,
    t.arrival_time,
    EXTRACT(EPOCH FROM (t.arrival_time - t.departure_time))/3600 as duration_hours,
    
    -- Bus & Driver
    b.bus_id,
    b.license_plate as plate_number,
    bc.class_name as bus_class,
    d.full_name as driver_name,
    d.phone_number as driver_phone,
    
    -- Seat Utilization (Real-time)
    (SELECT count(*) FROM public.seats s WHERE s.bus_id = t.bus_id) as total_capacity,
    (SELECT count(*) FROM public.passengers pass WHERE pass.trip_id = t.trip_id AND pass.passenger_status = 'active') as booked_seats,
    (
        (SELECT count(*) FROM public.seats s WHERE s.bus_id = t.bus_id) - 
        (SELECT count(*) FROM public.passengers pass WHERE pass.trip_id = t.trip_id AND pass.passenger_status = 'active') -
        (SELECT jsonb_array_length(COALESCE(t.blocked_seats, '[]'::jsonb)))
    ) as available_seats,
    
    -- Financials (Estimated)
    t.base_price,
    (SELECT count(*) FROM public.passengers pass WHERE pass.trip_id = t.trip_id AND pass.passenger_status = 'active') * t.base_price as estimated_revenue

FROM public.trips t
JOIN public.partners p ON t.partner_id = p.partner_id
JOIN public.routes r ON t.route_id = r.route_id
LEFT JOIN public.buses b ON t.bus_id = b.bus_id
LEFT JOIN public.bus_classes bc ON b.bus_class_id = bc.bus_class_id
LEFT JOIN public.drivers d ON t.driver_id = d.driver_id
ORDER BY t.departure_time DESC;

COMMENT ON VIEW public.reports_trips_operations IS 'Operational view for trips management with real-time seat stats';

-- ========================================================
-- 2. REPORTS: BOOKING MANAGEMENT (Customer Intelligence)
-- ========================================================
CREATE OR REPLACE VIEW public.reports_booking_management WITH (security_invoker=true) AS
SELECT 
    bk.booking_id,
    bk.booking_date,
    
    -- Customer Profile
    u.user_id,
    u.full_name as customer_name,
    u.phone_number as customer_phone,
    u.email as customer_email,
    
    -- Trip Context
    t.trip_id,
    r.origin_city || ' -> ' || r.destination_city as route_name,
    t.departure_time,
    p.company_name as operator,
    
    -- Statuses
    bk.booking_status,
    bk.payment_status,
    
    -- Financials
    bk.total_price,
    bk.platform_commission,
    bk.partner_revenue,
    bk.payment_method,
    
    -- Passengers
    (SELECT count(*) FROM public.passengers pass WHERE pass.booking_id = bk.booking_id) as passenger_count,
    
    -- Timing Analysis
    EXTRACT(EPOCH FROM (t.departure_time - bk.booking_date))/3600 as booked_hours_before_departure

FROM public.bookings bk
JOIN public.users u ON bk.user_id = u.user_id
JOIN public.trips t ON bk.trip_id = t.trip_id
JOIN public.partners p ON t.partner_id = p.partner_id
JOIN public.routes r ON t.route_id = r.route_id
ORDER BY bk.booking_date DESC;

COMMENT ON VIEW public.reports_booking_management IS 'Comprehensive booking report with customer and trip context';

-- ========================================================
-- 3. REPORTS: FINANCIAL TRANSACTIONS (Audit Layer)
-- ========================================================
-- Note: Assuming booking_ledger table exists as per previous migrations
CREATE OR REPLACE VIEW public.reports_financial_transactions WITH (security_invoker=true) AS
SELECT 
    bl.ledger_id,
    bl.created_at as transaction_date,
    bl.entry_type, -- booking, commission, refund, adjustment
    bl.amount,
    bl.currency, -- if exists, otherwise assume SAR
    
    -- Context
    bl.partner_id,
    p.company_name,
    bl.booking_id,
    
    -- Details
    bl.note as description,
    bk.payment_method,
    bk.payment_status as current_booking_payment_status

FROM public.booking_ledger bl
JOIN public.partners p ON bl.partner_id = p.partner_id
LEFT JOIN public.bookings bk ON bl.booking_id = bk.booking_id
ORDER BY bl.created_at DESC;

COMMENT ON VIEW public.reports_financial_transactions IS 'Double-entry style financial ledger view for audit';

-- ========================================================
-- 4. REPORTS: REFUND PROCESSING (Efficiency Layer)
-- ========================================================
CREATE OR REPLACE VIEW public.reports_refund_processing WITH (security_invoker=true) AS
SELECT 
    rf.refund_id,
    rf.created_at as request_date,
    
    -- Booking Context
    rf.booking_id,
    bk.total_price as original_amount,
    rf.refund_amount,
    rf.refund_method,
    
    -- Status & SLA
    rf.status,
    rf.processed_at,
    EXTRACT(EPOCH FROM (COALESCE(rf.processed_at, NOW()) - rf.created_at))/3600 as processing_time_hours,
    
    -- Actors
    u.full_name as customer_name,
    processor.full_name as processed_by_name,
    approver.full_name as approved_by_name,
    
    -- Details
    rf.rejection_reason,
    rf.notes,
    rf.refund_reference

FROM public.refunds rf
JOIN public.bookings bk ON rf.booking_id = bk.booking_id
JOIN public.users u ON rf.user_id = u.user_id
LEFT JOIN public.users processor ON rf.processed_by = processor.user_id
LEFT JOIN public.users approver ON rf.approved_by = approver.user_id
ORDER BY rf.created_at DESC;

COMMENT ON VIEW public.reports_refund_processing IS 'Refund processing tracking with SLA metrics';

-- ========================================================
-- 5. REPORTS: EXECUTIVE SUMMARY (Strategic Layer)
-- ========================================================
CREATE OR REPLACE VIEW public.reports_executive_summary WITH (security_invoker=true) AS
SELECT 
    -- Dimensions
    DATE_TRUNC('month', bk.booking_date) as report_month,
    t.partner_id,
    p.company_name,
    
    -- Volume KPIs
    COUNT(DISTINCT bk.booking_id) as total_bookings,
    COUNT(DISTINCT CASE WHEN bk.booking_status = 'confirmed' THEN bk.booking_id END) as confirmed_bookings,
    COUNT(DISTINCT CASE WHEN bk.booking_status = 'cancelled' THEN bk.booking_id END) as cancelled_bookings,
    
    -- Financial KPIs
    SUM(CASE WHEN bk.payment_status = 'paid' THEN bk.total_price ELSE 0 END) as gross_revenue,
    SUM(CASE WHEN bk.payment_status = 'paid' THEN bk.platform_commission ELSE 0 END) as platform_revenue,
    SUM(CASE WHEN bk.payment_status = 'paid' THEN bk.partner_revenue ELSE 0 END) as partner_revenue,
    
    -- Efficiency KPIs
    ROUND(
        (COUNT(DISTINCT CASE WHEN bk.booking_status = 'cancelled' THEN bk.booking_id END)::NUMERIC / 
        NULLIF(COUNT(DISTINCT bk.booking_id), 0) * 100), 2
    ) as cancellation_rate,
    
    -- Occupancy Indicator (Approximate)
    COUNT(DISTINCT t.trip_id) as trips_operated

FROM public.bookings bk
JOIN public.trips t ON bk.trip_id = t.trip_id
JOIN public.partners p ON t.partner_id = p.partner_id
GROUP BY 1, 2, 3
ORDER BY 1 DESC, 4 DESC;

COMMENT ON VIEW public.reports_executive_summary IS 'High-level executive summary grouped by month and partner';

-- ========================================================
-- PERMISSIONS
-- ========================================================
GRANT SELECT ON public.reports_trips_operations TO authenticated;
GRANT SELECT ON public.reports_booking_management TO authenticated;
GRANT SELECT ON public.reports_financial_transactions TO authenticated;
GRANT SELECT ON public.reports_refund_processing TO authenticated;
GRANT SELECT ON public.reports_executive_summary TO authenticated;

COMMIT;
