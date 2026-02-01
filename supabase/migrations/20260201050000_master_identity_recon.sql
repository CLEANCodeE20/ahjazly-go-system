-- ==========================================================
-- MASTER IDENTITY REPAIR (FINAL RECONCILIATION)
-- Date: 2026-02-01
-- Purpose: Fix ALL remaining "user_id" references in user_roles table
-- and restore full functionality to notifications & cities management.
-- ==========================================================

BEGIN;

-- 1. FIX has_role() FUNCTION
CREATE OR REPLACE FUNCTION public.has_role(p_user_id UUID, p_role_name TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE auth_id = p_user_id 
    AND role::text = p_role_name
  );
$$;

-- 2. FIX check_permission() FUNCTION
CREATE OR REPLACE FUNCTION public.check_permission(p_permission_code TEXT)
RETURNS BOOLEAN
LANGUAGE PLPGSQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role TEXT;
    v_partner_id INTEGER;
BEGIN
    SELECT role, partner_id INTO v_role, v_partner_id 
    FROM public.user_roles 
    WHERE auth_id = auth.uid() 
    LIMIT 1;

    IF v_role = 'SUPERUSER' OR v_role = 'admin' THEN
        RETURN TRUE;
    END IF;

    IF EXISTS (SELECT 1 FROM public.role_permissions WHERE role = v_role AND partner_id = v_partner_id) THEN
        RETURN EXISTS (
            SELECT 1 
            FROM public.role_permissions 
            WHERE role = v_role 
              AND permission_code = p_permission_code
              AND partner_id = v_partner_id
        );
    ELSE
        RETURN EXISTS (
            SELECT 1 
            FROM public.role_permissions 
            WHERE role = v_role 
              AND permission_code = p_permission_code
              AND partner_id IS NULL
        );
    END IF;
END;
$$;

-- 3. FIX ALL NOTIFICATION FUNCTIONS (Update user_id -> auth_id for user_roles)

-- A. notify_booking_changes
CREATE OR REPLACE FUNCTION public.notify_booking_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_trip_info RECORD;
    v_user_fullname TEXT;
    v_partner_admin_auth_id UUID;
BEGIN
    SELECT t.trip_id, p.partner_id, p.company_name, r.origin_city, r.destination_city
    INTO v_trip_info
    FROM public.trips t
    JOIN public.partners p ON t.partner_id = p.partner_id
    JOIN public.routes r ON t.route_id = r.route_id
    WHERE t.trip_id = COALESCE(NEW.trip_id, OLD.trip_id);

    SELECT full_name INTO v_user_fullname FROM public.users WHERE auth_id = COALESCE(NEW.auth_id, OLD.auth_id);

    SELECT ur.auth_id INTO v_partner_admin_auth_id
    FROM public.user_roles ur
    WHERE ur.partner_id = v_trip_info.partner_id
    AND ur.role IN ('PARTNER_ADMIN', 'manager')
    LIMIT 1;

    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.notifications (auth_id, title, message, type, priority)
        VALUES (NEW.auth_id, 'تم استلام طلبك', format('مرحباً %s، تم استلام طلب الحجز الخاص بك لرحلة %s إلى %s.', v_user_fullname, v_trip_info.origin_city, v_trip_info.destination_city), 'booking', 'high');

        IF v_partner_admin_auth_id IS NOT NULL THEN
            INSERT INTO public.notifications (auth_id, title, message, type, priority, partner_id)
            VALUES (v_partner_admin_auth_id, 'طلب حجز جديد', format('طلب حجز جديد من %s.', v_user_fullname), 'booking', 'high', v_trip_info.partner_id);
        END IF;
    ELSIF (TG_OP = 'UPDATE') THEN
        IF OLD.booking_status IS DISTINCT FROM NEW.booking_status THEN
            INSERT INTO public.notifications (auth_id, title, message, type)
            VALUES (NEW.auth_id, 'تحديث حالة الحجز', format('تمت مراجعة حجزك وحالته الآن: %s', NEW.booking_status), 'booking');
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- B. notify_partner_on_new_rating
CREATE OR REPLACE FUNCTION public.notify_partner_on_new_rating()
RETURNS TRIGGER AS $$
DECLARE
    v_trip_info TEXT;
    v_admin_auth_id UUID;
BEGIN
    SELECT r.origin_city || ' - ' || r.destination_city INTO v_trip_info
    FROM public.trips t JOIN public.routes r ON t.route_id = r.route_id
    WHERE t.trip_id = NEW.trip_id;
    
    FOR v_admin_auth_id IN (
        SELECT auth_id FROM public.user_roles 
        WHERE partner_id = NEW.partner_id AND role IN ('PARTNER_ADMIN', 'manager')
    ) LOOP
        INSERT INTO public.notifications (auth_id, title, message, type, partner_id)
        VALUES (v_admin_auth_id, 'تقييم جديد', 'تم استلام تقييم ' || NEW.stars || ' نجوم من عميل.', 'trip', NEW.partner_id);
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. FIX CITIES & BANNERS RLS (Corrected Column Names)
DROP POLICY IF EXISTS "Admins can manage cities" ON public.cities;
CREATE POLICY "Admins can manage cities" 
ON public.cities FOR ALL 
TO authenticated 
USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERUSER'
    OR 
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE auth_id = auth.uid() AND role IN ('SUPERUSER', 'admin', 'PARTNER_ADMIN')
    )
);

DROP POLICY IF EXISTS "Admins manage banners" ON public.banners;
CREATE POLICY "Admins manage banners" 
ON public.banners FOR ALL 
TO authenticated
USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERUSER'
    OR 
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE auth_id = auth.uid() AND role IN ('SUPERUSER', 'admin', 'PARTNER_ADMIN')
    )
);

COMMIT;
