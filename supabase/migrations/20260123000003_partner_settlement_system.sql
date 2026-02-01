-- ========================================================
-- PARTNER SETTLEMENT & CLEARING HOUSE SYSTEM
-- Date: 2026-01-23
-- Purpose: Track and manage payments from Platform to Partners
-- ========================================================

BEGIN;

-- 1. Create Partner Settlements Table
CREATE TABLE IF NOT EXISTS public.partner_settlements (
    settlement_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    partner_id BIGINT REFERENCES public.partners(partner_id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status refund_status_enum DEFAULT 'pending'::refund_status_enum,
    payment_reference VARCHAR(255), -- Bank transfer ID
    processed_by BIGINT REFERENCES public.users(user_id),
    processed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create a View for Partner Balance (The real "Clearing House" logic)
CREATE OR REPLACE VIEW public.partner_balance_report AS
WITH partner_stats AS (
    SELECT 
        p.partner_id,
        p.company_name,
        -- Total revenue from bookings (Paid)
        COALESCE(SUM(CASE WHEN b.payment_status = 'paid' THEN b.partner_revenue ELSE 0 END), 0) as total_earned,
        -- Total already settled (Paid to partner)
        COALESCE((
            SELECT SUM(amount) 
            FROM public.partner_settlements ps 
            WHERE ps.partner_id = p.partner_id AND ps.status = 'completed'
        ), 0) as total_settled,
        -- Total pending settlements
        COALESCE((
            SELECT SUM(amount) 
            FROM public.partner_settlements ps 
            WHERE ps.partner_id = p.partner_id AND ps.status = 'pending'
        ), 0) as total_pending_settlement
    FROM public.partners p
    LEFT JOIN public.trips t ON t.partner_id = p.partner_id
    LEFT JOIN public.bookings b ON b.trip_id = t.trip_id
    GROUP BY p.partner_id, p.company_name
)
SELECT 
    *,
    (total_earned - total_settled) as current_balance,
    (total_earned - total_settled - total_pending_settlement) as available_for_settlement
FROM partner_stats;

-- 3. RLS Policies
ALTER TABLE public.partner_settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all settlements" ON public.partner_settlements
    FOR ALL USING (is_admin());

CREATE POLICY "Partners can view own settlements" ON public.partner_settlements
    FOR SELECT USING (
        partner_id IN (SELECT partner_id FROM public.user_roles WHERE user_id = auth.uid())
    );

GRANT SELECT ON public.partner_balance_report TO authenticated;

COMMIT;
