-- ========================================================
-- PAYMENT SYSTEM ENHANCEMENTS
-- ========================================================
-- Purpose:
-- 1. Improve refund tracking with detailed status and processing info
-- 2. Add basic financial reports (views)
-- 3. Add constraint to prevent duplicate payments
-- ========================================================

BEGIN;

-- ========================================================
-- PART 1: REFUND TRACKING IMPROVEMENTS
-- ========================================================

-- 1.1 Add tracking columns to refunds table
ALTER TABLE public.refunds 
ADD COLUMN IF NOT EXISTS processed_by BIGINT REFERENCES public.users(user_id),
ADD COLUMN IF NOT EXISTS approved_by BIGINT REFERENCES public.users(user_id),
ADD COLUMN IF NOT EXISTS refund_reference VARCHAR(255),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN public.refunds.processed_by IS 'المستخدم الذي عالج طلب الاسترداد';
COMMENT ON COLUMN public.refunds.approved_by IS 'المستخدم الذي وافق على الاسترداد';
COMMENT ON COLUMN public.refunds.refund_reference IS 'رقم مرجعي للاسترداد من البنك/بوابة الدفع';
COMMENT ON COLUMN public.refunds.rejection_reason IS 'سبب رفض الاسترداد (إن وجد)';
COMMENT ON COLUMN public.refunds.notes IS 'ملاحظات إضافية';

-- 1.2 Create refund status enum if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'refund_status_enum') THEN
        CREATE TYPE refund_status_enum AS ENUM (
            'pending',      -- في انتظار المعالجة
            'approved',     -- تمت الموافقة
            'processing',   -- قيد المعالجة
            'completed',    -- تم الاسترداد
            'rejected',     -- مرفوض
            'failed'        -- فشل
        );
    END IF;
END $$;

-- 1.3 Update refunds table to use enum (if status is varchar)
DO $$
BEGIN
    -- Check if status column is varchar
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'refunds' 
        AND column_name = 'status' 
        AND data_type = 'character varying'
    ) THEN
        -- Add temporary column
        ALTER TABLE public.refunds ADD COLUMN status_new refund_status_enum;
        
        -- Migrate data
        UPDATE public.refunds SET status_new = 
            CASE 
                WHEN status = 'pending' THEN 'pending'::refund_status_enum
                WHEN status = 'completed' THEN 'completed'::refund_status_enum
                WHEN status = 'rejected' THEN 'rejected'::refund_status_enum
                WHEN status = 'failed' THEN 'failed'::refund_status_enum
                ELSE 'pending'::refund_status_enum
            END;
        
        -- Drop old column and rename
        ALTER TABLE public.refunds DROP COLUMN status;
        ALTER TABLE public.refunds RENAME COLUMN status_new TO status;
        ALTER TABLE public.refunds ALTER COLUMN status SET DEFAULT 'pending'::refund_status_enum;
    END IF;
END $$;

-- 1.4 Create function to update refund status
CREATE OR REPLACE FUNCTION public.update_refund_status(
    p_refund_id BIGINT,
    p_new_status refund_status_enum,
    p_refund_reference VARCHAR DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_rejection_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_user_id BIGINT;
    v_old_status refund_status_enum;
    v_refund RECORD;
BEGIN
    -- Get current user
    SELECT user_id INTO v_user_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1;
    
    -- Get refund details
    SELECT * INTO v_refund FROM public.refunds WHERE refund_id = p_refund_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Refund not found');
    END IF;
    
    v_old_status := v_refund.status;
    
    -- Update refund
    UPDATE public.refunds
    SET 
        status = p_new_status,
        refund_reference = COALESCE(p_refund_reference, refund_reference),
        notes = COALESCE(p_notes, notes),
        rejection_reason = CASE WHEN p_new_status = 'rejected' THEN p_rejection_reason ELSE rejection_reason END,
        processed_by = CASE WHEN p_new_status IN ('processing', 'completed', 'rejected', 'failed') THEN v_user_id ELSE processed_by END,
        approved_by = CASE WHEN p_new_status = 'approved' THEN v_user_id ELSE approved_by END,
        processed_at = CASE WHEN p_new_status = 'completed' THEN NOW() ELSE processed_at END
    WHERE refund_id = p_refund_id;
    
    -- Send notification to user
    IF p_new_status = 'completed' THEN
        INSERT INTO public.notifications (user_id, title, message, type, priority)
        VALUES (
            v_refund.user_id,
            'تم استرداد المبلغ',
            format('تم استرداد مبلغ %s ر.س للحجز رقم #%s', v_refund.refund_amount, v_refund.booking_id),
            'payment',
            'high'
        );
    ELSIF p_new_status = 'rejected' THEN
        INSERT INTO public.notifications (user_id, title, message, type, priority)
        VALUES (
            v_refund.user_id,
            'تم رفض طلب الاسترداد',
            format('تم رفض طلب استرداد المبلغ للحجز رقم #%s. السبب: %s', v_refund.booking_id, p_rejection_reason),
            'payment',
            'high'
        );
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'refund_id', p_refund_id,
        'old_status', v_old_status,
        'new_status', p_new_status
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.update_refund_status IS 'تحديث حالة طلب الاسترداد مع إرسال إشعارات';

-- ========================================================
-- PART 2: PREVENT DUPLICATE PAYMENTS
-- ========================================================

-- 2.1 Create unique index to prevent duplicate successful payments
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_successful_payment 
ON public.payment_transactions(booking_id) 
WHERE status = 'paid';

COMMENT ON INDEX idx_unique_successful_payment IS 'منع الدفع المزدوج لنفس الحجز';

-- ========================================================
-- PART 3: FINANCIAL REPORTS (VIEWS)
-- ========================================================

-- 3.1 Daily Financial Summary
CREATE OR REPLACE VIEW public.daily_financial_summary AS
SELECT 
    DATE(b.booking_date) as report_date,
    COUNT(DISTINCT b.booking_id) as total_bookings,
    COUNT(DISTINCT CASE WHEN b.payment_status = 'paid' THEN b.booking_id END) as paid_bookings,
    COUNT(DISTINCT CASE WHEN b.booking_status = 'cancelled' THEN b.booking_id END) as cancelled_bookings,
    
    -- Revenue
    COALESCE(SUM(CASE WHEN b.payment_status = 'paid' THEN b.total_price ELSE 0 END), 0) as gross_revenue,
    COALESCE(SUM(CASE WHEN b.payment_status = 'paid' THEN b.platform_commission ELSE 0 END), 0) as platform_commission,
    COALESCE(SUM(CASE WHEN b.payment_status = 'paid' THEN b.partner_revenue ELSE 0 END), 0) as partner_revenue,
    
    -- Refunds
    COALESCE(SUM(CASE WHEN b.payment_status = 'refunded' THEN b.refund_amount ELSE 0 END), 0) as total_refunds,
    COALESCE(SUM(CASE WHEN b.payment_status = 'refunded' THEN b.cancellation_fee ELSE 0 END), 0) as cancellation_fees,
    
    -- Net Revenue
    COALESCE(SUM(CASE WHEN b.payment_status = 'paid' THEN b.total_price ELSE 0 END), 0) - 
    COALESCE(SUM(CASE WHEN b.payment_status = 'refunded' THEN b.refund_amount ELSE 0 END), 0) as net_revenue
FROM public.bookings b
GROUP BY DATE(b.booking_date)
ORDER BY report_date DESC;

COMMENT ON VIEW public.daily_financial_summary IS 'ملخص مالي يومي شامل';

-- 3.2 Partner Financial Summary
CREATE OR REPLACE VIEW public.partner_financial_summary AS
SELECT 
    p.partner_id,
    p.company_name,
    COUNT(DISTINCT b.booking_id) as total_bookings,
    COUNT(DISTINCT CASE WHEN b.payment_status = 'paid' THEN b.booking_id END) as paid_bookings,
    
    -- Revenue
    COALESCE(SUM(CASE WHEN b.payment_status = 'paid' THEN b.total_price ELSE 0 END), 0) as gross_revenue,
    COALESCE(SUM(CASE WHEN b.payment_status = 'paid' THEN b.platform_commission ELSE 0 END), 0) as platform_commission,
    COALESCE(SUM(CASE WHEN b.payment_status = 'paid' THEN b.partner_revenue ELSE 0 END), 0) as partner_revenue,
    
    -- Refunds
    COALESCE(SUM(CASE WHEN b.payment_status = 'refunded' THEN b.refund_amount ELSE 0 END), 0) as total_refunds,
    
    -- Net
    COALESCE(SUM(CASE WHEN b.payment_status = 'paid' THEN b.partner_revenue ELSE 0 END), 0) as net_partner_revenue,
    
    -- Payment Methods Breakdown
    COALESCE(SUM(CASE WHEN b.payment_method IN ('card', 'wallet', 'stc_pay') AND b.payment_status = 'paid' THEN b.total_price ELSE 0 END), 0) as online_payments,
    COALESCE(SUM(CASE WHEN b.payment_method IN ('cash', 'bank_transfer') AND b.payment_status = 'paid' THEN b.total_price ELSE 0 END), 0) as cash_payments
FROM public.partners p
LEFT JOIN public.trips t ON t.partner_id = p.partner_id
LEFT JOIN public.bookings b ON b.trip_id = t.trip_id
GROUP BY p.partner_id, p.company_name
ORDER BY gross_revenue DESC;

COMMENT ON VIEW public.partner_financial_summary IS 'ملخص مالي لكل شريك';

-- 3.3 Refunds Status Report
CREATE OR REPLACE VIEW public.refunds_status_report AS
SELECT 
    r.refund_id,
    r.booking_id,
    b.user_id,
    u.full_name as customer_name,
    r.refund_amount,
    r.refund_method,
    r.status,
    r.refund_reference,
    r.created_at as requested_at,
    r.processed_at,
    EXTRACT(EPOCH FROM (COALESCE(r.processed_at, NOW()) - r.created_at))/3600 as processing_hours,
    processor.full_name as processed_by_name,
    approver.full_name as approved_by_name,
    r.rejection_reason,
    r.notes,
    b.payment_method as original_payment_method,
    t.partner_id
FROM public.refunds r
JOIN public.bookings b ON r.booking_id = b.booking_id
JOIN public.users u ON r.user_id = u.user_id
LEFT JOIN public.users processor ON r.processed_by = processor.user_id
LEFT JOIN public.users approver ON r.approved_by = approver.user_id
LEFT JOIN public.trips t ON b.trip_id = t.trip_id
ORDER BY r.created_at DESC;

COMMENT ON VIEW public.refunds_status_report IS 'تقرير حالة طلبات الاسترداد';

-- 3.4 Monthly Revenue Report
CREATE OR REPLACE VIEW public.monthly_revenue_report AS
SELECT 
    DATE_TRUNC('month', b.booking_date) as month,
    COUNT(DISTINCT b.booking_id) as total_bookings,
    COUNT(DISTINCT CASE WHEN b.payment_status = 'paid' THEN b.booking_id END) as paid_bookings,
    
    -- Revenue
    COALESCE(SUM(CASE WHEN b.payment_status = 'paid' THEN b.total_price ELSE 0 END), 0) as gross_revenue,
    COALESCE(SUM(CASE WHEN b.payment_status = 'paid' THEN b.platform_commission ELSE 0 END), 0) as platform_commission,
    
    -- Refunds
    COALESCE(SUM(CASE WHEN b.payment_status = 'refunded' THEN b.refund_amount ELSE 0 END), 0) as total_refunds,
    
    -- Net
    COALESCE(SUM(CASE WHEN b.payment_status = 'paid' THEN b.total_price ELSE 0 END), 0) - 
    COALESCE(SUM(CASE WHEN b.payment_status = 'refunded' THEN b.refund_amount ELSE 0 END), 0) as net_revenue,
    
    -- Average
    COALESCE(AVG(CASE WHEN b.payment_status = 'paid' THEN b.total_price END), 0) as avg_booking_value
FROM public.bookings b
GROUP BY DATE_TRUNC('month', b.booking_date)
ORDER BY month DESC;

COMMENT ON VIEW public.monthly_revenue_report IS 'تقرير الإيرادات الشهرية';

-- 3.5 Payment Methods Report
CREATE OR REPLACE VIEW public.payment_methods_report AS
SELECT 
    b.payment_method,
    COUNT(*) as transaction_count,
    COUNT(CASE WHEN b.payment_status = 'paid' THEN 1 END) as successful_count,
    COUNT(CASE WHEN b.payment_status = 'failed' THEN 1 END) as failed_count,
    COALESCE(SUM(CASE WHEN b.payment_status = 'paid' THEN b.total_price ELSE 0 END), 0) as total_amount,
    COALESCE(AVG(CASE WHEN b.payment_status = 'paid' THEN b.total_price END), 0) as avg_transaction_value,
    ROUND(
        COUNT(CASE WHEN b.payment_status = 'paid' THEN 1 END)::NUMERIC / 
        NULLIF(COUNT(*)::NUMERIC, 0) * 100, 
        2
    ) as success_rate_percentage
FROM public.bookings b
WHERE b.payment_method IS NOT NULL
GROUP BY b.payment_method
ORDER BY total_amount DESC;

COMMENT ON VIEW public.payment_methods_report IS 'تقرير طرق الدفع والنجاح';

-- ========================================================
-- PART 4: RLS POLICIES FOR VIEWS
-- ========================================================

-- Grant access to views
GRANT SELECT ON public.daily_financial_summary TO authenticated;
GRANT SELECT ON public.partner_financial_summary TO authenticated;
GRANT SELECT ON public.refunds_status_report TO authenticated;
GRANT SELECT ON public.monthly_revenue_report TO authenticated;
GRANT SELECT ON public.payment_methods_report TO authenticated;

COMMIT;
