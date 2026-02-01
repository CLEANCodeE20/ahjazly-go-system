-- ==========================================================
-- ID REVOLUTION MASTER MIGRATION (Phase 1)
-- Date: 2026-01-31
-- Purpose: Unifying Identity using UUID (auth_id) across all tables
-- ==========================================================

BEGIN;

-- 1. ADD UUID COLUMNS (AUTH_ID) TO ALL DEPENDENT TABLES
-- ==========================================================

-- Buses
ALTER TABLE public.buses ADD COLUMN IF NOT EXISTS owner_auth_id UUID REFERENCES auth.users(id);

-- Employees
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id);

-- Bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id);

-- Cancellations
ALTER TABLE public.booking_cancellations ADD COLUMN IF NOT EXISTS cancelled_by_auth_id UUID REFERENCES auth.users(id);

-- Payments & Refunds
ALTER TABLE public.payment_transactions ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id);
ALTER TABLE public.refunds ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id);

DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'refund_transactions' AND table_schema = 'public') THEN
        ALTER TABLE public.refund_transactions ADD COLUMN IF NOT EXISTS initiated_by_auth_id UUID REFERENCES auth.users(id);
        ALTER TABLE public.refund_transactions ADD COLUMN IF NOT EXISTS processed_by_auth_id UUID REFERENCES auth.users(id);
        ALTER TABLE public.refund_transactions ADD COLUMN IF NOT EXISTS completed_by_auth_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Finance & Commissions
ALTER TABLE public.commissions ADD COLUMN IF NOT EXISTS calculated_by_auth_id UUID REFERENCES auth.users(id);
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id);
ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS created_by_auth_id UUID REFERENCES auth.users(id);
ALTER TABLE public.wallet_withdrawal_requests ADD COLUMN IF NOT EXISTS processed_by_auth_id UUID REFERENCES auth.users(id);

-- Documents & Verification
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id);
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS reviewed_by_auth_id UUID REFERENCES auth.users(id);

-- Engagement (Ratings, Notifications, Support)
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id);
ALTER TABLE public.ratings ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id);
ALTER TABLE public.rating_responses ADD COLUMN IF NOT EXISTS responder_auth_id UUID REFERENCES auth.users(id);
ALTER TABLE public.rating_helpfulness ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id);
ALTER TABLE public.rating_reports ADD COLUMN IF NOT EXISTS reporter_auth_id UUID REFERENCES auth.users(id);
ALTER TABLE public.rating_reports ADD COLUMN IF NOT EXISTS reviewed_by_auth_id UUID REFERENCES auth.users(id);
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id);

-- Technical / Device tokens
ALTER TABLE public.user_device_tokens ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id);

-- History
ALTER TABLE public.trip_status_history ADD COLUMN IF NOT EXISTS changed_by_auth_id UUID REFERENCES auth.users(id);


-- 2. BACKFILL DATA (MIGRATE BIGINT TO UUID)
-- ==========================================================

-- Update logic: Join with public.users to get the auth_id (UUID) from the original user_id (BigInt)

UPDATE public.buses t SET owner_auth_id = u.auth_id FROM public.users u WHERE t.owner_user_id = u.user_id AND t.owner_auth_id IS NULL;
UPDATE public.employees t SET auth_id = u.auth_id FROM public.users u WHERE t.user_id = u.user_id AND t.auth_id IS NULL;
UPDATE public.bookings t SET auth_id = u.auth_id FROM public.users u WHERE t.user_id = u.user_id AND t.auth_id IS NULL;
UPDATE public.booking_cancellations t SET cancelled_by_auth_id = u.auth_id FROM public.users u WHERE t.cancelled_by_user_id = u.user_id AND t.cancelled_by_auth_id IS NULL;
UPDATE public.payment_transactions t SET auth_id = u.auth_id FROM public.users u WHERE t.user_id = u.user_id AND t.auth_id IS NULL;
UPDATE public.refunds t SET auth_id = u.auth_id FROM public.users u WHERE t.user_id = u.user_id AND t.auth_id IS NULL;

DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'refund_transactions' AND table_schema = 'public') THEN
        UPDATE public.refund_transactions t SET initiated_by_auth_id = u.auth_id FROM public.users u WHERE t.initiated_by = u.user_id AND t.initiated_by_auth_id IS NULL;
        UPDATE public.refund_transactions t SET processed_by_auth_id = u.auth_id FROM public.users u WHERE t.processed_by = u.user_id AND t.processed_by_auth_id IS NULL;
        UPDATE public.refund_transactions t SET completed_by_auth_id = u.auth_id FROM public.users u WHERE t.completed_by = u.user_id AND t.completed_by_auth_id IS NULL;
    END IF;
END $$;

UPDATE public.commissions t SET calculated_by_auth_id = u.auth_id FROM public.users u WHERE t.calculated_by = u.user_id AND t.calculated_by_auth_id IS NULL;
UPDATE public.wallets t SET auth_id = u.auth_id FROM public.users u WHERE t.user_id = u.user_id AND t.auth_id IS NULL;
UPDATE public.wallet_transactions t SET created_by_auth_id = u.auth_id FROM public.users u WHERE t.created_by = u.user_id AND t.created_by_auth_id IS NULL;
UPDATE public.wallet_withdrawal_requests t SET processed_by_auth_id = u.auth_id FROM public.users u WHERE t.processed_by = u.user_id AND t.processed_by_auth_id IS NULL;
UPDATE public.documents t SET auth_id = u.auth_id FROM public.users u WHERE t.user_id = u.user_id AND t.auth_id IS NULL;
UPDATE public.documents t SET reviewed_by_auth_id = u.auth_id FROM public.users u WHERE t.reviewed_by = u.user_id AND t.reviewed_by_auth_id IS NULL;
UPDATE public.notifications t SET auth_id = u.auth_id FROM public.users u WHERE t.user_id = u.user_id AND t.auth_id IS NULL;
UPDATE public.ratings t SET auth_id = u.auth_id FROM public.users u WHERE t.user_id = u.user_id AND t.auth_id IS NULL;
UPDATE public.rating_responses t SET responder_auth_id = u.auth_id FROM public.users u WHERE t.responder_user_id = u.user_id AND t.responder_auth_id IS NULL;
UPDATE public.rating_helpfulness t SET auth_id = u.auth_id FROM public.users u WHERE t.user_id = u.user_id AND t.auth_id IS NULL;
UPDATE public.rating_reports t SET reporter_auth_id = u.auth_id FROM public.users u WHERE t.reporter_user_id = u.user_id AND t.reporter_auth_id IS NULL;
UPDATE public.rating_reports t SET reviewed_by_auth_id = u.auth_id FROM public.users u WHERE t.reviewed_by = u.user_id AND t.reviewed_by_auth_id IS NULL;
UPDATE public.support_tickets t SET auth_id = u.auth_id FROM public.users u WHERE t.user_id = u.user_id AND t.auth_id IS NULL;
UPDATE public.user_device_tokens t SET auth_id = u.auth_id FROM public.users u WHERE t.user_id = u.user_id AND t.auth_id IS NULL;
UPDATE public.trip_status_history t SET changed_by_auth_id = u.auth_id FROM public.users u WHERE t.changed_by = u.user_id AND t.changed_by_auth_id IS NULL;

-- 3. CREATE INDEXES FOR PERFORMANCE
-- ==========================================================

CREATE INDEX IF NOT EXISTS idx_buses_owner_auth_id ON public.buses(owner_auth_id);
CREATE INDEX IF NOT EXISTS idx_employees_auth_id ON public.employees(auth_id);
CREATE INDEX IF NOT EXISTS idx_bookings_auth_id ON public.bookings(auth_id);
CREATE INDEX IF NOT EXISTS idx_wallets_auth_id ON public.wallets(auth_id);
CREATE INDEX IF NOT EXISTS idx_ratings_auth_id ON public.ratings(auth_id);
CREATE INDEX IF NOT EXISTS idx_notifications_auth_id ON public.notifications(auth_id);

COMMIT;
