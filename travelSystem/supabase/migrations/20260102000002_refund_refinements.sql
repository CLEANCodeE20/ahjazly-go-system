-- ========================================================
-- REFUND PROCESS REFINEMENTS (PHASE 2)
-- 1. Update Analytics to account for Refunded bookings (Fees only)
-- 2. Add User Notification trigger for completed refunds
-- ========================================================

-- 1. Corrected Analytics Views
-- Include 'refunded' bookings but count only the retained fee as revenue
CREATE OR REPLACE VIEW public.analytics_daily_revenue AS
SELECT 
    DATE(booking_date) as date,
    SUM(CASE WHEN payment_status = 'paid' THEN total_price ELSE COALESCE(cancellation_fee, 0) END) as total_revenue,
    SUM(platform_commission) as platform_revenue,
    SUM(partner_revenue) as partner_revenue,
    COUNT(booking_id) as bookings_count,
    COUNT(DISTINCT trips.partner_id) as active_partners
FROM public.bookings
LEFT JOIN public.trips ON bookings.trip_id = trips.trip_id
WHERE payment_status IN ('paid', 'refunded')
GROUP BY DATE(booking_date);

CREATE OR REPLACE VIEW public.analytics_partner_performance AS
SELECT 
    partners.partner_id,
    partners.company_name,
    COUNT(bookings.booking_id) as total_bookings,
    SUM(CASE WHEN bookings.payment_status = 'paid' THEN bookings.total_price ELSE COALESCE(bookings.cancellation_fee, 0) END) as total_revenue,
    SUM(bookings.platform_commission) as total_commission,
    SUM(bookings.partner_revenue) as net_revenue,
    AVG(CASE WHEN bookings.payment_status = 'paid' THEN bookings.total_price ELSE COALESCE(bookings.cancellation_fee, 0) END) as avg_booking_value
FROM public.partners
JOIN public.trips ON partners.partner_id = trips.partner_id
JOIN public.bookings ON trips.trip_id = bookings.trip_id
WHERE bookings.payment_status IN ('paid', 'refunded')
GROUP BY partners.partner_id, partners.company_name;

-- 2. Updated Dashboard Stats RPC
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
        'total_revenue', COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_price ELSE COALESCE(cancellation_fee, 0) END), 0),
        'total_bookings', COUNT(booking_id),
        'avg_booking_value', COALESCE(ROUND(AVG(CASE WHEN payment_status = 'paid' THEN total_price ELSE COALESCE(cancellation_fee, 0) END), 2), 0),
        'platform_revenue', COALESCE(SUM(platform_commission), 0)
    ) INTO result
    FROM public.bookings
    WHERE payment_status IN ('paid', 'refunded')
    AND booking_date BETWEEN start_date AND end_date;

    RETURN result;
END;
$$;

-- 3. User Notification & Audit for Refund Completion
CREATE OR REPLACE FUNCTION public.notify_user_refund_completed()
RETURNS TRIGGER AS $$
DECLARE
    v_employee_id INTEGER;
BEGIN
    -- Only trigger when status changes to 'completed'
    IF (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'completed') THEN
        
        -- 1. Notify the User
        INSERT INTO public.notifications (
            user_id,
            title,
            message,
            type,
            priority
        ) VALUES (
            NEW.user_id,
            'تمت عملية الاسترداد',
            format('مرحباً، تم بنجاح تحويل مبلغ %s ر.س إلى حسابك الخاص بالحجز رقم #%s. رقم العملية: %s.', 
                   NEW.refund_amount, NEW.booking_id, NEW.transaction_id),
            'booking',
            'high'
        );

        -- 2. Log in Audit Trail (booking_approvals)
        -- Attempt to find the employee who processed it (via current user)
        SELECT e.employee_id INTO v_employee_id 
        FROM public.employees e
        JOIN public.users u ON e.user_id = u.user_id
        WHERE u.auth_id = auth.uid();

        INSERT INTO public.booking_approvals (
            booking_id,
            employee_id,
            action_type,
            old_status,
            new_status,
            notes
        ) VALUES (
            NEW.booking_id,
            v_employee_id,
            'update',
            'refund_pending',
            'refund_completed',
            format('Refund processed manually. TxID: %s', NEW.transaction_id)
        );

    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notify_user_refund_completed ON public.refunds;
CREATE TRIGGER tr_notify_user_refund_completed
    AFTER UPDATE ON public.refunds
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_user_refund_completed();
