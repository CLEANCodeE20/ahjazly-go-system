-- ==========================================================
-- FINAL SETTLEMENT: GLOBAL IDENTITY & OPERATIONS ALIGNMENT
-- Date: 2026-02-01
-- Purpose: Unified fix for ALL operations (Identity, RBAC, Notifications)
-- This script wipes all potential "user_id" conflicts and standardizes on auth_id (UUID).
-- ==========================================================

BEGIN;

-- 1. CORE HELPER FUNCTIONS (Unified & Gold Standard)
-- ==========================================================

-- Clean up existing versions to avoid parameter name/return type conflicts
DROP FUNCTION IF EXISTS public.has_role(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.has_role(UUID, public.app_role) CASCADE;
DROP FUNCTION IF EXISTS public.check_permission(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.get_current_partner_id() CASCADE;
DROP FUNCTION IF EXISTS public.get_current_role() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_partner_id(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_partner_id(BIGINT) CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.auth_id_matches(BIGINT) CASCADE;
DROP FUNCTION IF EXISTS public.get_effective_wallet_id(BIGINT) CASCADE;
DROP FUNCTION IF EXISTS public.is_email_verified(UUID) CASCADE;

-- A. has_role()
CREATE OR REPLACE FUNCTION public.has_role(p_user_id UUID, p_role_name TEXT)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE auth_id = p_user_id AND (role::text = p_role_name OR role::text = 'SUPERUSER')
  );
$$;

-- B. check_permission()
CREATE OR REPLACE FUNCTION public.check_permission(p_permission_code TEXT)
RETURNS BOOLEAN LANGUAGE PLPGSQL STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_role TEXT;
    v_partner_id INTEGER;
BEGIN
    SELECT role, partner_id INTO v_role, v_partner_id 
    FROM public.user_roles WHERE auth_id = auth.uid() LIMIT 1;

    IF v_role = 'SUPERUSER' THEN RETURN TRUE; END IF;
    IF v_role = 'PARTNER_ADMIN' THEN RETURN TRUE; END IF;

    IF EXISTS (SELECT 1 FROM public.role_permissions WHERE role = v_role AND partner_id = v_partner_id) THEN
        RETURN EXISTS (SELECT 1 FROM public.role_permissions WHERE role = v_role AND permission_code = p_permission_code AND partner_id = v_partner_id);
    ELSE
        RETURN EXISTS (SELECT 1 FROM public.role_permissions WHERE role = v_role AND permission_code = p_permission_code AND partner_id IS NULL);
    END IF;
END;
$$;

-- C. get_current_partner_id()
CREATE OR REPLACE FUNCTION public.get_current_partner_id()
RETURNS BIGINT LANGUAGE SQL STABLE AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'partner_id')::BIGINT;
$$;

-- D. get_user_role()
CREATE OR REPLACE FUNCTION public.get_user_role(p_auth_id UUID)
RETURNS TEXT LANGUAGE SQL STABLE AS $$
  SELECT role::TEXT FROM public.user_roles WHERE auth_id = p_auth_id LIMIT 1;
$$;

-- E. get_user_partner_id()
CREATE OR REPLACE FUNCTION public.get_user_partner_id(p_auth_id UUID)
RETURNS BIGINT LANGUAGE SQL STABLE AS $$
  SELECT partner_id FROM public.user_roles WHERE auth_id = p_auth_id LIMIT 1;
$$;

-- F. is_email_verified()
CREATE OR REPLACE FUNCTION public.is_email_verified(p_auth_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT email_confirmed_at IS NOT NULL FROM auth.users WHERE id = p_auth_id;
$$;

-- G. is_admin() (Global Check)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'SUPERUSER');
$$;


-- 2. WALLET SYSTEM REBUILD (Standardized)
-- ==========================================================

DROP FUNCTION IF EXISTS public.process_wallet_transaction(BIGINT, BIGINT, wallet_transaction_type, NUMERIC, VARCHAR, TEXT);
DROP FUNCTION IF EXISTS public.process_wallet_transaction(BIGINT, wallet_transaction_type, NUMERIC, VARCHAR, TEXT);
DROP FUNCTION IF EXISTS public.process_wallet_transaction(UUID, wallet_transaction_type, NUMERIC, VARCHAR, TEXT);
DROP FUNCTION IF EXISTS public.process_wallet_transaction_uuid(UUID, wallet_transaction_type, NUMERIC, VARCHAR, TEXT);

CREATE OR REPLACE FUNCTION public.process_wallet_transaction(
    p_auth_id UUID,
    p_type wallet_transaction_type,
    p_amount NUMERIC,
    p_reference_id VARCHAR DEFAULT NULL,
    p_description TEXT DEFAULT NULL
)
RETURNS JSONB LANGUAGE PLPGSQL SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_wallet_id BIGINT;
    v_old_balance NUMERIC;
    v_new_balance NUMERIC;
BEGIN
    SELECT wallet_id, balance INTO v_wallet_id, v_old_balance 
    FROM public.wallets 
    WHERE auth_id = p_auth_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        -- Fallback: Check if user has a partner_id and return partner wallet
        SELECT w.wallet_id, w.balance INTO v_wallet_id, v_old_balance 
        FROM public.wallets w 
        JOIN public.user_roles ur ON w.partner_id = ur.partner_id 
        WHERE ur.auth_id = p_auth_id AND w.partner_id IS NOT NULL
        FOR UPDATE;
        
        IF NOT FOUND THEN
            RETURN jsonb_build_object('success', false, 'message', 'Wallet not found');
        END IF;
    END IF;

    IF p_type IN ('payment', 'withdrawal') THEN
        v_new_balance := v_old_balance - p_amount;
        IF v_new_balance < 0 THEN
            RETURN jsonb_build_object('success', false, 'message', 'Insufficient balance');
        END IF;
    ELSE
        v_new_balance := v_old_balance + p_amount;
    END IF;

    UPDATE public.wallets SET balance = v_new_balance, updated_at = now() WHERE wallet_id = v_wallet_id;

    INSERT INTO public.wallet_transactions (wallet_id, type, amount, previous_balance, new_balance, reference_id, description, created_by_auth_id)
    VALUES (v_wallet_id, p_type, p_amount, v_old_balance, v_new_balance, p_reference_id, p_description, auth.uid());

    RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$;


-- 3. RATING & REVIEWS (Identity Fix)
-- ==========================================================

DROP FUNCTION IF EXISTS public.can_user_rate_trip(BIGINT, BIGINT, BIGINT);
DROP FUNCTION IF EXISTS public.can_user_rate_trip(UUID, BIGINT, BIGINT);

CREATE OR REPLACE FUNCTION public.can_user_rate_trip(p_auth_id UUID, p_trip_id BIGINT, p_booking_id BIGINT)
RETURNS BOOLEAN LANGUAGE PLPGSQL STABLE SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE auth_id = p_auth_id 
      AND trip_id = p_trip_id 
      AND booking_id = p_booking_id
      AND booking_status = 'completed'
  );
END;
$$;


-- 4. NOTIFICATION ENGINE REBUILD (All Operations)
-- ==========================================================

-- A. Booking Changes
CREATE OR REPLACE FUNCTION public.notify_booking_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_trip RECORD;
    v_admin_auth_id UUID;
BEGIN
    SELECT t.partner_id, r.origin_city, r.destination_city INTO v_trip
    FROM public.trips t JOIN public.routes r ON t.route_id = r.route_id
    WHERE t.trip_id = NEW.trip_id;

    -- Notify Customer
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.notifications (auth_id, title, message, type, priority)
        VALUES (NEW.auth_id, 'تم الحجز بنجاح', format('تم استلام حجزك لرحلة %s - %s.', v_trip.origin_city, v_trip.destination_city), 'booking', 'high');
        
        -- Notify Partner Admin (Using auth_id)
        FOR v_admin_auth_id IN (SELECT auth_id FROM public.user_roles WHERE partner_id = v_trip.partner_id AND role IN ('PARTNER_ADMIN', 'manager', 'SUPERUSER')) LOOP
            INSERT INTO public.notifications (auth_id, title, message, type, partner_id)
            VALUES (v_admin_auth_id, 'حجز جديد', 'تم استلام حجز جديد.', 'booking', v_trip.partner_id);
        END LOOP;
    ELSIF (TG_OP = 'UPDATE' AND OLD.booking_status IS DISTINCT FROM NEW.booking_status) THEN
        INSERT INTO public.notifications (auth_id, title, message, type)
        VALUES (NEW.auth_id, 'تحديث الحجز', format('حالة حجزك الآن: %s', NEW.booking_status), 'booking');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- B. Rating & Feedback
CREATE OR REPLACE FUNCTION public.notify_partner_on_new_rating()
RETURNS TRIGGER AS $$
DECLARE
    v_admin_auth_id UUID;
BEGIN
    FOR v_admin_auth_id IN (SELECT auth_id FROM public.user_roles WHERE partner_id = NEW.partner_id AND role IN ('PARTNER_ADMIN', 'manager', 'SUPERUSER')) LOOP
        INSERT INTO public.notifications (auth_id, title, message, type, partner_id)
        VALUES (v_admin_auth_id, 'تقييم جديد', format('تم استلام تقييم %s نجوم.', NEW.stars), 'trip', NEW.partner_id);
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- C. Refund Operations
CREATE OR REPLACE FUNCTION public.notify_refund_request()
RETURNS TRIGGER AS $$
DECLARE
    v_partner_id BIGINT;
    v_admin_auth_id UUID;
BEGIN
    SELECT t.partner_id INTO v_partner_id FROM public.bookings b JOIN public.trips t ON b.trip_id = t.trip_id WHERE b.booking_id = NEW.booking_id;
    FOR v_admin_auth_id IN (SELECT auth_id FROM public.user_roles WHERE partner_id = v_partner_id AND role IN ('PARTNER_ADMIN', 'manager', 'SUPERUSER')) LOOP
        INSERT INTO public.notifications (auth_id, title, message, type, partner_id)
        VALUES (v_admin_auth_id, 'طلب استرداد', 'هناك طلب استرداد مالي جديد.', 'booking', v_partner_id);
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. GLOBAL RLS RESET (Gold Standard Alignment)
-- ==========================================================

DO $$ 
DECLARE 
    tbl TEXT;
    all_tables TEXT[] := ARRAY['users', 'user_roles', 'cities', 'banners', 'faqs', 'bookings', 'notifications', 'ratings', 'refunds', 'wallets', 'user_device_tokens', 'support_tickets'];
BEGIN
    FOREACH tbl IN ARRAY all_tables LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
            EXECUTE format('DROP POLICY IF EXISTS "Global View Access" ON public.%I', tbl);
            EXECUTE format('DROP POLICY IF EXISTS "Unified Master Access" ON public.%I', tbl);
            
            -- Public SELECT for global tables (Cities / Banners / FAQs)
            IF tbl IN ('cities', 'banners', 'faqs') THEN
                EXECUTE format('CREATE POLICY "Global View Access" ON public.%I FOR SELECT USING (true)', tbl);
            END IF;

            -- Master Access for Admin, Partners, and Owners
            DECLARE
                v_owner_check TEXT := '';
                v_partner_check TEXT := '';
            BEGIN
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'auth_id') THEN
                    v_owner_check := 'OR auth_id = auth.uid()';
                END IF;

                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'partner_id') THEN
                    v_partner_check := 'OR (
                        partner_id = (auth.jwt() -> ''app_metadata'' ->> ''partner_id'')::BIGINT 
                        AND (auth.jwt() -> ''app_metadata'' ->> ''role'') IN (''PARTNER_ADMIN'', ''manager'', ''accountant'', ''support'', ''supervisor'')
                    )';
                END IF;

                EXECUTE format('CREATE POLICY "Unified Master Access" ON public.%I FOR ALL TO authenticated USING (
                    (auth.jwt() -> ''app_metadata'' ->> ''role'') = ''SUPERUSER''
                    OR (public.has_role(auth.uid(), ''SUPERUSER''))
                    %s
                    %s
                )', tbl, v_owner_check, v_partner_check);
            END;
        END IF;
    END LOOP;
END $$;


-- 4. STORAGE POLICIES REBUILD (Restoring Cascaded Policies)
-- ==========================================================

-- A. App Assets (Banners, etc.)
DROP POLICY IF EXISTS "Public View App Assets" ON storage.objects;
CREATE POLICY "Public View App Assets" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'app-assets');

DROP POLICY IF EXISTS "Admins manage App Assets" ON storage.objects;
CREATE POLICY "Admins manage App Assets" ON storage.objects FOR ALL TO authenticated 
USING (bucket_id = 'app-assets' AND public.has_role(auth.uid(), 'SUPERUSER'));

-- B. Partner Documents
DROP POLICY IF EXISTS "Anyone can upload partner documents" ON storage.objects;
CREATE POLICY "Anyone can upload partner documents" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'partner-documents');

DROP POLICY IF EXISTS "Authenticated users can view partner documents" ON storage.objects;
CREATE POLICY "Authenticated users can view partner documents" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'partner-documents');

DROP POLICY IF EXISTS "Admins can manage partner documents" ON storage.objects;
CREATE POLICY "Admins can manage partner documents" ON storage.objects FOR ALL TO authenticated 
USING (bucket_id = 'partner-documents' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'SUPERUSER')));


-- 5. RELATIONSHIP & JOIN FIXES (Enable Postgrest Auto-Joins)
-- ==========================================================

-- A. Ensure public.users(auth_id) is UNIQUE to be a FK target
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_auth_id_key CASCADE;
ALTER TABLE public.users ADD CONSTRAINT users_auth_id_key UNIQUE (auth_id);

-- B. Standardize Foreign Keys for common tables to point to public.users(auth_id)
-- This allows select=*,users(full_name) queries to work correctly.

DO $$ 
BEGIN 
    -- 1. support_tickets
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'support_tickets' AND column_name = 'auth_id') THEN
        ALTER TABLE public.support_tickets DROP CONSTRAINT IF EXISTS support_tickets_auth_id_fkey;
        ALTER TABLE public.support_tickets ADD CONSTRAINT support_tickets_auth_id_fkey FOREIGN KEY (auth_id) REFERENCES public.users(auth_id) ON DELETE CASCADE;
    END IF;

    -- 2. bookings
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'auth_id') THEN
        ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_auth_id_fkey;
        ALTER TABLE public.bookings ADD CONSTRAINT bookings_auth_id_fkey FOREIGN KEY (auth_id) REFERENCES public.users(auth_id) ON DELETE CASCADE;
    END IF;

    -- 3. ratings
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ratings' AND column_name = 'auth_id') THEN
        ALTER TABLE public.ratings DROP CONSTRAINT IF EXISTS ratings_auth_id_fkey;
        ALTER TABLE public.ratings ADD CONSTRAINT ratings_auth_id_fkey FOREIGN KEY (auth_id) REFERENCES public.users(auth_id) ON DELETE CASCADE;
    END IF;

    -- 4. notifications
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'auth_id') THEN
        ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_auth_id_fkey;
        ALTER TABLE public.notifications ADD CONSTRAINT notifications_auth_id_fkey FOREIGN KEY (auth_id) REFERENCES public.users(auth_id) ON DELETE CASCADE;
    END IF;

    -- 5. wallets
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'wallets' AND column_name = 'auth_id') THEN
        ALTER TABLE public.wallets DROP CONSTRAINT IF EXISTS wallets_auth_id_fkey;
        ALTER TABLE public.wallets ADD CONSTRAINT wallets_auth_id_fkey FOREIGN KEY (auth_id) REFERENCES public.users(auth_id) ON DELETE CASCADE;
    END IF;

    -- 6. user_roles (CRITICAL for dashboard loading)
    -- The frontend specifically looks for: user_roles_auth_id_public_fkey
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_roles' AND column_name = 'auth_id') THEN
        ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_auth_id_public_fkey;
        ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_auth_id_public_fkey FOREIGN KEY (auth_id) REFERENCES public.users(auth_id) ON DELETE CASCADE;
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_roles' AND column_name = 'user_id') THEN
        -- Fallback if column is still named user_id but holds UUID
        ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_auth_id_public_fkey;
        ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_auth_id_public_fkey FOREIGN KEY (user_id) REFERENCES public.users(auth_id) ON DELETE CASCADE;
    END IF;

    -- 7. partners (Manager relationship)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'partners' AND column_name = 'manager_auth_id') THEN
        ALTER TABLE public.partners DROP CONSTRAINT IF EXISTS partners_manager_auth_public_fkey;
        ALTER TABLE public.partners ADD CONSTRAINT partners_manager_auth_public_fkey FOREIGN KEY (manager_auth_id) REFERENCES public.users(auth_id) ON DELETE SET NULL;
    END IF;
END $$;


-- 6. RE-ATTACH ALL TRIGGER ENGINES
-- ==========================================================
DROP TRIGGER IF EXISTS trigger_notify_booking_changes ON public.bookings;
CREATE TRIGGER trigger_notify_booking_changes AFTER INSERT OR UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.notify_booking_changes();

DROP TRIGGER IF EXISTS notify_partner_on_rating_trigger ON public.ratings;
CREATE TRIGGER notify_partner_on_rating_trigger AFTER INSERT ON public.ratings FOR EACH ROW EXECUTE FUNCTION public.notify_partner_on_new_rating();

DROP TRIGGER IF EXISTS tr_notify_refund_request ON public.refunds;
CREATE TRIGGER tr_notify_refund_request AFTER INSERT ON public.refunds FOR EACH ROW EXECUTE FUNCTION public.notify_refund_request();


-- 7. REBUILD CRITICAL VIEWS & FUNCTIONS (Identity Unification)
-- ==========================================================

-- A. update_refund_status (Standardized)
CREATE OR REPLACE FUNCTION public.update_refund_status(
    p_refund_id BIGINT,
    p_new_status public.refund_status_enum,
    p_refund_reference VARCHAR DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_rejection_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_refund RECORD;
BEGIN
    -- Get refund details
    SELECT * INTO v_refund FROM public.refunds WHERE refund_id = p_refund_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Refund not found');
    END IF;
    
    -- Update refund using auth.uid() directly for processed_by (standardizing to UUID/auth_id)
    UPDATE public.refunds
    SET 
        status = p_new_status,
        refund_reference = COALESCE(p_refund_reference, refund_reference),
        notes = COALESCE(p_notes, notes),
        rejection_reason = CASE WHEN p_new_status = 'rejected' THEN p_rejection_reason ELSE rejection_reason END,
        processed_at = CASE WHEN p_new_status = 'completed' THEN NOW() ELSE processed_at END
    WHERE refund_id = p_refund_id;
    
    -- Send notification to user (using auth_id)
    IF p_new_status = 'completed' THEN
        INSERT INTO public.notifications (auth_id, title, message, type, priority)
        VALUES (
            v_refund.auth_id,
            'تم استرداد المبلغ',
            format('تم استرداد مبلغ %s ر.س للحجز رقم #%s', v_refund.refund_amount, v_refund.booking_id),
            'payment',
            'high'
        );
    ELSIF p_new_status = 'rejected' THEN
        INSERT INTO public.notifications (auth_id, title, message, type, priority)
        VALUES (
            v_refund.auth_id,
            'تم رفض طلب الاسترداد',
            format('تم رفض طلب استرداد المبلغ للحجز رقم #%s. السبب: %s', v_refund.booking_id, p_rejection_reason),
            'payment',
            'high'
        );
    END IF;
    
    RETURN jsonb_build_object('success', true, 'refund_id', p_refund_id, 'new_status', p_new_status);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- B. refunds_status_report (Unified)
DROP VIEW IF EXISTS public.refunds_status_report CASCADE;
CREATE OR REPLACE VIEW public.refunds_status_report AS
SELECT 
    r.refund_id,
    r.booking_id,
    r.auth_id,
    u.full_name as customer_name,
    r.refund_amount,
    r.refund_method,
    r.status,
    r.refund_reference,
    r.created_at as requested_at,
    r.processed_at,
    b.payment_method as original_payment_method,
    t.partner_id
FROM public.refunds r
JOIN public.bookings b ON r.booking_id = b.booking_id
JOIN public.users u ON r.auth_id = u.auth_id
LEFT JOIN public.trips t ON b.trip_id = t.trip_id;

-- C. Rating Analytics Views (Unified)
DROP VIEW IF EXISTS public.v_recent_ratings CASCADE;
CREATE OR REPLACE VIEW public.v_recent_ratings AS
SELECT 
    r.rating_id,
    r.rating_date,
    u.full_name as user_name,
    p.company_name as partner_name,
    d.full_name as driver_name,
    t.trip_id,
    r.stars,
    r.comment,
    r.is_verified,
    EXISTS(SELECT 1 FROM public.rating_responses rr WHERE rr.rating_id = r.rating_id) as has_response
FROM public.ratings r
JOIN public.users u ON r.auth_id = u.auth_id
JOIN public.partners p ON r.partner_id = p.partner_id
LEFT JOIN public.drivers d ON r.driver_id = d.driver_id
JOIN public.trips t ON r.trip_id = t.trip_id
WHERE r.is_visible = true;

DROP VIEW IF EXISTS public.v_ratings_requiring_attention CASCADE;
CREATE OR REPLACE VIEW public.v_ratings_requiring_attention AS
SELECT 
    r.rating_id,
    r.rating_date,
    EXTRACT(DAY FROM NOW() - r.rating_date)::INTEGER as days_since_rating,
    u.full_name as user_name,
    p.partner_id,
    p.company_name as partner_name,
    r.stars,
    r.service_rating,
    r.cleanliness_rating,
    r.punctuality_rating,
    r.comfort_rating,
    r.value_for_money_rating,
    r.comment,
    r.reported_count,
    r.helpful_count,
    r.not_helpful_count,
    r.is_verified,
    EXISTS(SELECT 1 FROM public.rating_responses rr WHERE rr.rating_id = r.rating_id) as has_response,
    r.sentiment,
    r.sentiment_score
FROM public.ratings r
JOIN public.users u ON r.auth_id = u.auth_id
JOIN public.partners p ON r.partner_id = p.partner_id
WHERE r.is_visible = true
AND (r.stars <= 3 OR r.reported_count > 0);

DROP VIEW IF EXISTS public.v_rating_details CASCADE;
CREATE OR REPLACE VIEW public.v_rating_details AS
SELECT 
    r.rating_id,
    r.rating_date,
    r.auth_id,
    u.full_name as user_name,
    u.email as user_email,
    r.booking_id,
    r.stars as overall_rating,
    r.comment,
    r.is_verified,
    p.company_name as partner_name,
    EXISTS(SELECT 1 FROM public.rating_responses rr WHERE rr.rating_id = r.rating_id) as has_response
FROM public.ratings r
JOIN public.users u ON r.auth_id = u.auth_id
JOIN public.partners p ON r.partner_id = p.partner_id;

-- D. Ensure permissions are granted for everything
GRANT SELECT ON public.refunds_status_report TO authenticated;
GRANT SELECT ON public.v_recent_ratings TO authenticated;
GRANT SELECT ON public.v_ratings_requiring_attention TO authenticated;
GRANT SELECT ON public.v_rating_details TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_refund_status TO authenticated;

COMMIT;
