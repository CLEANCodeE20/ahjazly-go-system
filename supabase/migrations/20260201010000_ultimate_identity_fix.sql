-- ==========================================================
-- THE ULTIMATE IDENTITY ALIGNMENT & NOTIFICATION ENGINE FIX
-- Date: 2026-02-01
-- Purpose: Resolve "record new has no field user_id" by standardizing 
-- all triggers/functions to use the Gold Standard (auth_id UUID).
-- ==========================================================

BEGIN;

-- 1. Ensure Notifications Table is Fully Modernized (Safety Check)
DO $$ 
BEGIN
    -- Add auth_id (UUID)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'auth_id') THEN
        ALTER TABLE public.notifications ADD COLUMN auth_id UUID REFERENCES auth.users(id);
    END IF;

    -- Add Professional Fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'title') THEN
        ALTER TABLE public.notifications ADD COLUMN title VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'priority') THEN
        ALTER TABLE public.notifications ADD COLUMN priority VARCHAR(20) DEFAULT 'medium';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'action_url') THEN
        ALTER TABLE public.notifications ADD COLUMN action_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'partner_id') THEN
        ALTER TABLE public.notifications ADD COLUMN partner_id BIGINT REFERENCES public.partners(partner_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'metadata') THEN
        ALTER TABLE public.notifications ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- Map existing user_id data if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'user_id') THEN
        UPDATE public.notifications n
        SET auth_id = u.auth_id
        FROM public.users u
        WHERE n.user_id = u.user_id AND n.auth_id IS NULL;
        
        ALTER TABLE public.notifications DROP COLUMN user_id CASCADE;
    END IF;
END $$;

-- 2. REBUILD BOOKING NOTIFICATION ENGINE
CREATE OR REPLACE FUNCTION public.notify_booking_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_trip_info RECORD;
    v_user_fullname TEXT;
    v_partner_admin_auth_id UUID;
BEGIN
    -- Fetch Trip & Partner Info
    SELECT t.trip_id, p.partner_id, p.company_name, r.origin_city, r.destination_city
    INTO v_trip_info
    FROM public.trips t
    JOIN public.partners p ON t.partner_id = p.partner_id
    JOIN public.routes r ON t.route_id = r.route_id
    WHERE t.trip_id = COALESCE(NEW.trip_id, OLD.trip_id);

    -- Fetch User Info using auth_id (NEW FIELD)
    SELECT full_name INTO v_user_fullname 
    FROM public.users 
    WHERE auth_id = COALESCE(NEW.auth_id, OLD.auth_id);

    -- Find ONE Admin for the Partner (Using Gold Standard UI Roles)
    SELECT ur.user_id INTO v_partner_admin_auth_id
    FROM public.user_roles ur
    WHERE ur.partner_id = v_trip_info.partner_id
    AND ur.role IN ('PARTNER_ADMIN', 'manager')
    LIMIT 1;

    -- CASE 1: NEW BOOKING
    IF (TG_OP = 'INSERT') THEN
        -- Notify Customer
        INSERT INTO public.notifications (auth_id, title, message, type, priority)
        VALUES (
            NEW.auth_id,
            'تم استلام طلبك',
            format('مرحباً %s، تم استلام طلب الحجز الخاص بك لرحلة %s إلى %s وهو قيد المراجعة.', 
                   v_user_fullname, v_trip_info.origin_city, v_trip_info.destination_city),
            'booking', 'high'
        );

        -- Notify Partner Admin
        IF v_partner_admin_auth_id IS NOT NULL THEN
            INSERT INTO public.notifications (auth_id, title, message, type, priority, partner_id)
            VALUES (
                v_partner_admin_auth_id,
                'طلب حجز جديد',
                format('طلب حجز جديد من %s على رحلة %s - %s.', v_user_fullname, v_trip_info.origin_city, v_trip_info.destination_city),
                'booking', 'high', v_trip_info.partner_id
            );
        END IF;

    -- CASE 2: STATUS CHANGE
    ELSIF (TG_OP = 'UPDATE') THEN
        IF OLD.booking_status IS DISTINCT FROM NEW.booking_status OR OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
            IF NEW.booking_status = 'confirmed' OR NEW.payment_status = 'paid' THEN
                INSERT INTO public.notifications (auth_id, title, message, type, priority)
                VALUES (NEW.auth_id, 'تم تأكيد الحجز!', format('مبروك! تم تأكيد حجزك للرحلة إلى %s.', v_trip_info.destination_city), 'booking', 'high');
            ELSIF NEW.booking_status = 'cancelled' OR NEW.booking_status = 'rejected' THEN
                INSERT INTO public.notifications (auth_id, title, message, type, priority)
                VALUES (NEW.auth_id, 'تحديث حالة الحجز', 'عذراً، تم إلغاء/رفض الحجز الخاص بك.', 'booking', 'high');
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. REBUILD RATING NOTIFICATION ENGINE
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
        SELECT user_id FROM public.user_roles 
        WHERE partner_id = NEW.partner_id AND role IN ('PARTNER_ADMIN', 'manager')
    ) LOOP
        INSERT INTO public.notifications (auth_id, title, message, type, partner_id)
        VALUES (v_admin_auth_id, 'تقييم جديد', 'تم استلام تقييم ' || NEW.stars || ' نجوم للرحلة: ' || v_trip_info, 'trip', NEW.partner_id);
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.notify_user_to_rate_trip()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.booking_status = 'completed' AND (OLD.booking_status IS DISTINCT FROM 'completed') THEN
        INSERT INTO public.notifications (auth_id, title, message, type)
        VALUES (NEW.auth_id, 'قيم رحلتك', 'نتمنى أن تكون استمتعت برحلتك! يرجى تقييم الخدمة.', 'trip');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. REBUILD REFUND NOTIFICATION ENGINE
CREATE OR REPLACE FUNCTION public.notify_refund_request()
RETURNS TRIGGER AS $$
DECLARE
    v_partner_id BIGINT;
    v_admin_auth_id UUID;
BEGIN
    SELECT t.partner_id INTO v_partner_id FROM public.bookings b JOIN public.trips t ON b.trip_id = t.trip_id WHERE b.booking_id = NEW.booking_id;
    
    FOR v_admin_auth_id IN (
        SELECT user_id FROM public.user_roles WHERE partner_id = v_partner_id AND role IN ('PARTNER_ADMIN', 'manager')
    ) LOOP
        INSERT INTO public.notifications (auth_id, title, message, type, partner_id)
        VALUES (v_admin_auth_id, 'طلب استرداد', format('هناك طلب استرداد جديد للحجز #%s.', NEW.booking_id), 'booking', v_partner_id);
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RE-ATTACH ALL TRIGGERS (Gold Standard Refresh)
DROP TRIGGER IF EXISTS trigger_notify_booking_changes ON public.bookings;
CREATE TRIGGER trigger_notify_booking_changes AFTER INSERT OR UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.notify_booking_changes();

DROP TRIGGER IF EXISTS notify_partner_on_rating_trigger ON public.ratings;
CREATE TRIGGER notify_partner_on_rating_trigger AFTER INSERT ON public.ratings FOR EACH ROW EXECUTE FUNCTION public.notify_partner_on_new_rating();

DROP TRIGGER IF EXISTS notify_user_to_rate_trip_trigger ON public.bookings;
CREATE TRIGGER notify_user_to_rate_trip_trigger AFTER UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.notify_user_to_rate_trip();

DROP TRIGGER IF EXISTS tr_notify_refund_request ON public.refunds;
CREATE TRIGGER tr_notify_refund_request AFTER INSERT ON public.refunds FOR EACH ROW EXECUTE FUNCTION public.notify_refund_request();

-- 6. RPC Fix for Cancellation (Ensure it uses auth_id)
CREATE OR REPLACE FUNCTION public.cancel_booking_rpc(p_booking_id BIGINT, p_reason TEXT DEFAULT 'Cancelled', p_confirm BOOLEAN DEFAULT false)
RETURNS JSONB AS $$
DECLARE
    v_booking RECORD;
BEGIN
    SELECT * INTO v_booking FROM public.bookings WHERE booking_id = p_booking_id;
    IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'message', 'Booking not found'); END IF;
    
    IF p_confirm THEN
        UPDATE public.bookings SET booking_status = 'cancelled', cancel_reason = p_reason, cancel_timestamp = now() WHERE booking_id = p_booking_id;
        UPDATE public.passengers SET passenger_status = 'cancelled' WHERE booking_id = p_booking_id;
    END IF;
    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
