-- ==========================================================
-- THE FINAL PURGE (SCHEMA CLEANUP - ULTRA ROBUST V7 - THE ULTIMATE FIX)
-- Date: 2026-01-31
-- Purpose: Breaking ALL legacy dependencies (BigInt IDs & user_type)
-- This version updates FUNCTIONS and TRIGGERS before dropping the column.
-- ==========================================================

BEGIN;

-- 1. DROP DEPENDENT VIEWS (CASCADE covers everything)
-- ==========================================================
DROP VIEW IF EXISTS public.v_top_rated_partners CASCADE;
DROP VIEW IF EXISTS public.v_partner_rating_stats CASCADE;
DROP VIEW IF EXISTS public.v_driver_rating_stats CASCADE;
DROP VIEW IF EXISTS public.v_rating_trends_monthly CASCADE;
DROP VIEW IF EXISTS public.v_recent_ratings CASCADE;
DROP VIEW IF EXISTS public.v_ratings_requiring_attention CASCADE;
DROP VIEW IF EXISTS public.v_rating_details CASCADE;
DROP VIEW IF EXISTS public.booking_details_view CASCADE;
DROP VIEW IF EXISTS public.refunds_status_report CASCADE;
DROP VIEW IF EXISTS public.reports_booking_management CASCADE;
DROP VIEW IF EXISTS public.reports_refund_processing CASCADE;
DROP VIEW IF EXISTS public.vw_user_redirection CASCADE;

-- 2. UPDATE FUNCTIONS/TRIGGERS TO REMOVE user_type DEPENDENCY
-- ==========================================================

-- A. Update handle_new_user (The core creation logic)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
    v_role public.app_role;
BEGIN
    -- Determine role based on email domain
    IF (new.email LIKE '%@admin.com') OR (new.email LIKE '%@ahjazly.com') THEN
        v_role := 'SUPERUSER'::public.app_role;
    ELSE
        v_role := 'TRAVELER'::public.app_role;
    END IF;

    -- Insert into public.users (WITHOUT user_type)
    INSERT INTO public.users (auth_id, full_name, email, account_status)
    VALUES (
        new.id, 
        COALESCE(new.raw_user_meta_data->>'full_name', 'New User'), 
        new.email, 
        'active'
    )
    ON CONFLICT (auth_id) DO UPDATE
    SET email = new.email;

    -- Assign Role in user_roles (UUID user_id)
    INSERT INTO public.user_roles (user_id, role, partner_id)
    VALUES (new.id, v_role, NULL)
    ON CONFLICT (user_id, role) DO NOTHING;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- B. Update notify_admin_new_partner
CREATE OR REPLACE FUNCTION public.notify_admin_new_partner()
RETURNS TRIGGER AS $$
DECLARE
    admin_auth_id UUID;
BEGIN
    -- Find an admin via user_roles (UUID)
    SELECT user_id INTO admin_auth_id FROM public.user_roles WHERE role = 'SUPERUSER' LIMIT 1;
    
    IF admin_auth_id IS NOT NULL THEN
        INSERT INTO public.notifications (auth_id, type, title, message, action_url, priority)
        VALUES (admin_auth_id, 'system', 'طلب انضمام جديد', 'تقدمت شركة ' || NEW.company_name || ' بطلب انضمام للمنصة.', '/admin/partners', 'high');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- C. Update rating notification triggers (if they exist)
CREATE OR REPLACE FUNCTION public.notify_partner_rating()
RETURNS TRIGGER AS $$
DECLARE
    v_partner_admin_id UUID;
BEGIN
    -- Find partner admin via user_roles
    SELECT user_id INTO v_partner_admin_id 
    FROM public.user_roles 
    WHERE partner_id = NEW.partner_id AND role = 'PARTNER_ADMIN' 
    LIMIT 1;

    IF v_partner_admin_id IS NOT NULL THEN
        INSERT INTO public.notifications (auth_id, type, title, message, priority)
        VALUES (v_partner_admin_id, 'feedback', 'تقييم جديد', 'تم إضافة تقييم جديد لخدمتكم: ' || NEW.stars || ' نجوم', 'medium');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. GLOBAL POLICY WIPE (Aggressive deletion of RLS barriers)
-- ==========================================================
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'users', 'bookings', 'passengers', 'notifications', 'ratings', 
            'rating_responses', 'rating_helpfulness', 'rating_reports', 
            'support_tickets', 'user_device_tokens', 'wallets', 'employees', 
            'drivers', 'booking_cancellations', 'banners', 'buses'
        )
    ) 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- 4. THE PURGE (DELETE LEGACY COLUMNS)
-- ==========================================================

-- Users
ALTER TABLE public.users DROP COLUMN IF EXISTS user_type CASCADE;

-- Cleanup all other user_id columns
ALTER TABLE public.bookings DROP COLUMN IF EXISTS user_id CASCADE;
ALTER TABLE public.passengers DROP COLUMN IF EXISTS user_id CASCADE;
ALTER TABLE public.notifications DROP COLUMN IF EXISTS user_id CASCADE;
ALTER TABLE public.ratings DROP COLUMN IF EXISTS user_id CASCADE;
ALTER TABLE public.support_tickets DROP COLUMN IF EXISTS user_id CASCADE;
ALTER TABLE public.wallets DROP COLUMN IF EXISTS user_id CASCADE;
ALTER TABLE public.employees DROP COLUMN IF EXISTS user_id CASCADE;
ALTER TABLE public.user_device_tokens DROP COLUMN IF EXISTS user_id CASCADE;

-- 5. RECREATE GLOBAL SYSTEMS (GOLD STANDARD)
-- ==========================================================

-- Final Redirection View
CREATE OR REPLACE VIEW public.vw_user_redirection AS
SELECT 
    au.id as auth_id,
    u.account_status,
    ur.role as app_role,
    ur.partner_id,
    CASE 
        WHEN u.account_status != 'active' AND ur.role != 'SUPERUSER' THEN 'REJECT_PENDING'
        WHEN ur.role = 'SUPERUSER' THEN 'REDIRECT_ADMIN'
        WHEN ur.role IN ('PARTNER_ADMIN', 'manager', 'accountant', 'support', 'supervisor') THEN 'REDIRECT_DASHBOARD'
        ELSE 'REDIRECT_LOGIN'
    END as action
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.auth_id
LEFT JOIN public.user_roles ur ON au.id = ur.user_id;

-- Generic RLS Re-enablement
DO $$ 
DECLARE 
    t TEXT;
    all_tables TEXT[] := ARRAY['bookings', 'notifications', 'ratings', 'support_tickets', 'wallets', 'user_device_tokens'];
BEGIN
    FOREACH t IN ARRAY all_tables LOOP
        EXECUTE format('CREATE POLICY "Generic owner access" ON public.%I FOR ALL USING (auth_id = auth.uid() OR (auth.jwt() -> ''app_metadata'' ->> ''role'') = ''SUPERUSER'')', t);
    END LOOP;
END $$;

-- Special Admin policies
CREATE POLICY "Admins manage banners" ON public.banners FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERUSER');
CREATE POLICY "Admins manage reports" ON public.rating_reports FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERUSER');

COMMIT;
