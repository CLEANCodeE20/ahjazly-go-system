-- ==========================================================
-- INTEGRATED EVENT NOTIFICATION ENGINE (Phase 5)
-- Date: 2026-02-03
-- Purpose: Complete all-case notification coverage for Partners & Admins
-- ==========================================================

BEGIN;

-- 1. ENHANCED BOOKING NOTIFICATION (Covers Cancellations)
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

    -- Fetch User Info using auth_id
    SELECT full_name INTO v_user_fullname 
    FROM public.users 
    WHERE auth_id = COALESCE(NEW.auth_id, OLD.auth_id);

    -- Find Admins for the Partner
    -- We'll notify ONE main admin for now, or loop for all in a loop if needed.
    
    -- CASE 1: NEW BOOKING (Stay the same)
    IF (TG_OP = 'INSERT') THEN
        -- Notify Customer
        INSERT INTO public.notifications (auth_id, title, message, type, priority)
        VALUES (
            NEW.auth_id,
            'تم استلام طلبك',
            format('مرحباً %s، تم استلام طلب الحجز الخاص بك لرحلة %s إلى %s.', 
                   v_user_fullname, v_trip_info.origin_city, v_trip_info.destination_city),
            'booking', 'high'
        );

        -- Notify Partner Admins
        FOR v_partner_admin_auth_id IN (
            SELECT user_id FROM public.user_roles 
            WHERE partner_id = v_trip_info.partner_id AND role = 'PARTNER_ADMIN'
        ) LOOP
            INSERT INTO public.notifications (auth_id, title, message, type, priority, partner_id, action_url)
            VALUES (
                v_partner_admin_auth_id,
                'طلب حجز جديد',
                format('طلب حجز جديد من %s على رحلة %s - %s.', v_user_fullname, v_trip_info.origin_city, v_trip_info.destination_city),
                'booking', 'high', v_trip_info.partner_id, '/dashboard/bookings'
            );
        END LOOP;

    -- CASE 2: UPDATES (Targeting Cancellations specifically)
    ELSIF (TG_OP = 'UPDATE') THEN
        -- A: User Cancelled
        IF OLD.booking_status != 'cancelled' AND NEW.booking_status = 'cancelled' THEN
             FOR v_partner_admin_auth_id IN (
                SELECT user_id FROM public.user_roles 
                WHERE partner_id = v_trip_info.partner_id AND role = 'PARTNER_ADMIN'
            ) LOOP
                INSERT INTO public.notifications (auth_id, title, message, type, priority, partner_id, action_url)
                VALUES (
                    v_partner_admin_auth_id,
                    'تم إلغاء حجز',
                    format('قام العميل %s بإلغاء حجزه لرحلة %s.', v_user_fullname, v_trip_info.destination_city),
                    'booking', 'high', v_trip_info.partner_id, '/dashboard/bookings'
                );
            END LOOP;
        END IF;

        -- B: Status Changes (Confirmed/Rejected)
        IF OLD.booking_status IS DISTINCT FROM NEW.booking_status THEN
            IF NEW.booking_status = 'confirmed' THEN
                INSERT INTO public.notifications (auth_id, title, message, type, priority, action_url)
                VALUES (NEW.auth_id, 'تم تأكيد حجزك!', 'مبروك! تم قبول وتأكيد حجزك بنجاح.', 'booking', 'high', '/notifications');
            ELSIF NEW.booking_status = 'rejected' THEN
                INSERT INTO public.notifications (auth_id, title, message, type, priority)
                VALUES (NEW.auth_id, 'تحديث حالة الحجز', 'نأسف، تم رفض طلب الحجز الخاص بك.', 'booking', 'high');
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. NOTIFICATION ON SETTLEMENT (Clearing House Alerts)
CREATE OR REPLACE FUNCTION public.notify_partner_on_settlement()
RETURNS TRIGGER AS $$
DECLARE
    v_partner_admin_auth_id UUID;
    v_partner_name TEXT;
BEGIN
    SELECT company_name INTO v_partner_name FROM public.partners WHERE partner_id = NEW.partner_id;

    IF (NEW.status = 'completed') THEN
        FOR v_partner_admin_auth_id IN (
            SELECT user_id FROM public.user_roles 
            WHERE partner_id = NEW.partner_id AND role = 'PARTNER_ADMIN'
        ) LOOP
            INSERT INTO public.notifications (auth_id, title, message, type, priority, partner_id, action_url)
            VALUES (
                v_partner_admin_auth_id,
                'تم تحويل مستحقات مالية',
                format('تم تسجيل حوالة بمبلغ %s ر.س لحساب شركتكم (%s). رقم المرجع: %s', NEW.amount, v_partner_name, COALESCE(NEW.payment_reference, '---')),
                'payment', 'high', NEW.partner_id, '/dashboard/wallet'
            );
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. NOTIFICATION ON TRIP STATUS CHANGE (Passenger Alerts)
CREATE OR REPLACE FUNCTION public.notify_trip_status_change()
RETURNS TRIGGER AS $$
DECLARE
    v_passenger_auth_id UUID;
    v_trip_info TEXT;
    v_title TEXT;
    v_message TEXT;
BEGIN
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        -- Prepare messages based on status
        IF NEW.status = 'in_progress' THEN
            v_title := 'بدأت الرحلة 🚌';
            v_message := 'تحركت الرحلة الآن! نتمنى لك رحلة سعيدة.';
        ELSIF NEW.status = 'delayed' THEN
            v_title := 'تنبيه: تأخر الرحلة';
            v_message := 'نعتذر، حدث تأخير بسيط في موعد انطلاق رحلتك. شكراً لصبرك.';
        ELSIF NEW.status = 'cancelled' THEN
             v_title := 'تنبيه: إلغاء الرحلة';
             v_message := 'نأسف لإبلاغك بأن الرحلة قد تم إلغاؤها. سيتم التواصل معك لمزيد من التفاصيل.';
        ELSE
            RETURN NEW;
        END IF;

        -- Fetch origin/destination for context
        SELECT r.origin_city || ' - ' || r.destination_city INTO v_trip_info
        FROM public.routes r WHERE r.route_id = NEW.route_id;

        -- Notify all confirmed passengers
        FOR v_passenger_auth_id IN (
            SELECT auth_id FROM public.bookings 
            WHERE trip_id = NEW.trip_id AND booking_status = 'confirmed'
        ) LOOP
            INSERT INTO public.notifications (auth_id, title, message, type, priority, action_url)
            VALUES (
                v_passenger_auth_id,
                v_title,
                v_message || ' (رحلة: ' || v_trip_info || ')',
                'trip',
                'high',
                '/notifications'
            );
        END LOOP;

        -- NEW: Automatic Booking Cancellation & Refund Flagging
        IF NEW.status = 'cancelled' THEN
            -- 1. Update all confirmed bookings to cancelled
            -- We set refund_amount = total_price because cancellation is by carrier
            UPDATE public.bookings
            SET 
                booking_status = 'cancelled',
                cancel_reason = 'تم إلغاء الرحلة من قبل الشركة الناقلة',
                cancel_timestamp = now(),
                refund_amount = total_price,
                payment_status = CASE WHEN payment_status = 'paid' THEN 'refunded'::payment_status ELSE payment_status END
            WHERE trip_id = NEW.trip_id AND booking_status = 'confirmed';

            -- 2. Release all seats for these bookings
            UPDATE public.passengers
            SET passenger_status = 'cancelled'
            WHERE trip_id = NEW.trip_id AND passenger_status = 'active';

            -- 3. Insert into refunds table for accountant processing
            INSERT INTO public.refunds (booking_id, user_id, refund_amount, refund_method, status)
            SELECT booking_id, user_id, total_price, payment_method::text, 'pending'
            FROM public.bookings
            WHERE trip_id = NEW.trip_id 
            AND booking_status = 'cancelled' 
            AND cancel_reason = 'تم إلغاء الرحلة من قبل الشركة الناقلة'
            AND refund_amount > 0;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. OPERATIONAL UPGRADES (Seat Management)
-- Add blocked_seats array for manual seat closure by partner admins
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS blocked_seats TEXT[] DEFAULT '{}';
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS seat_layout_type VARCHAR(50) DEFAULT 'standard_4_columns';

-- 5. MODERN RLS FOR DRIVERS (Partner Isolation)
DROP POLICY IF EXISTS "Partners can view their drivers" ON public.drivers;
DROP POLICY IF EXISTS "Partner full access to drivers" ON public.drivers;
CREATE POLICY "Partner full access to drivers" 
ON public.drivers 
FOR ALL 
USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERUSER'
    OR (
        partner_id = (auth.jwt() -> 'app_metadata' ->> 'partner_id')::bigint
        AND (auth.jwt() -> 'app_metadata' ->> 'role') IN ('PARTNER_ADMIN', 'manager', 'accountant', 'support', 'supervisor')
    )
);

-- 6. ATTACH TRIGGERS
DROP TRIGGER IF EXISTS trigger_notify_partner_on_settlement ON public.partner_settlements;
CREATE TRIGGER trigger_notify_partner_on_settlement 
AFTER INSERT OR UPDATE ON public.partner_settlements 
FOR EACH ROW EXECUTE FUNCTION public.notify_partner_on_settlement();

DROP TRIGGER IF EXISTS trigger_notify_trip_status_change ON public.trips;
CREATE TRIGGER trigger_notify_trip_status_change
AFTER UPDATE ON public.trips
FOR EACH ROW EXECUTE FUNCTION public.notify_trip_status_change();

COMMIT;
