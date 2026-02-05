-- ==============================================================================
-- FINAL CONSOLIDATED FIX (2025-12-28)
-- This migration resolves:
-- 1. Commission FK Error: Splits logic into BEFORE/AFTER triggers.
-- 2. Notification Type Error: Joins using auth_id (UUID) = user_roles.user_id.
-- 3. Notification Enum Error: Uses correct 'partner' role instead of 'partner_admin'.
-- ==============================================================================

-- 1. CLEANUP: Drop all existing problematic triggers and functions
-- Aggressively drop all known variations of these triggers
DROP TRIGGER IF EXISTS trigger_calculate_commission ON public.bookings;
DROP TRIGGER IF EXISTS calculate_booking_commission_trigger ON public.bookings;
DROP TRIGGER IF EXISTS trigger_notify_booking_changes ON public.bookings;
DROP TRIGGER IF EXISTS trigger_calculate_financials ON public.bookings;
DROP TRIGGER IF EXISTS trigger_create_commission_records ON public.bookings;

-- Drop functions with CASCADE to ensure all dependent triggers are also removed
DROP FUNCTION IF EXISTS public.calculate_booking_commission() CASCADE;
DROP FUNCTION IF EXISTS public.calculate_booking_financials() CASCADE;
DROP FUNCTION IF EXISTS public.create_commission_records() CASCADE;
DROP FUNCTION IF EXISTS public.notify_booking_changes() CASCADE;


-- 2. COMMISSIONS: Step A - Calculate Financials (BEFORE INSERT)
CREATE OR REPLACE FUNCTION public.calculate_booking_financials()
RETURNS TRIGGER AS $$
DECLARE
    trip_record RECORD;
    partner_record RECORD;
    partner_commission_rate NUMERIC(5,2);
    trip_partner_id BIGINT;
BEGIN
    -- Get Trip and Partner Info
    SELECT * INTO trip_record FROM public.trips WHERE trip_id = NEW.trip_id;
    IF NOT FOUND THEN
         -- Handle error or just return NEW (skip calculation)
         RETURN NEW;
    END IF;

    trip_partner_id := trip_record.partner_id;

    SELECT * INTO partner_record FROM public.partners WHERE partner_id = trip_partner_id;
    
    -- Set Commission Rate
    IF partner_record.commission_percentage IS NOT NULL THEN
        partner_commission_rate := partner_record.commission_percentage;
    ELSE
        partner_commission_rate := 10.00; -- Default
    END IF;

    -- Calculate Values
    -- platform_commission = Total Price * (Rate / 100)
    NEW.platform_commission := ROUND((NEW.total_price * partner_commission_rate / 100), 2);
    
    -- partner_revenue = Total Price - Commission
    NEW.partner_revenue := NEW.total_price - NEW.platform_commission;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 3. COMMISSIONS: Step B - Create Records (AFTER INSERT)
CREATE OR REPLACE FUNCTION public.create_commission_records()
RETURNS TRIGGER AS $$
DECLARE
    trip_record RECORD;
    partner_record RECORD;
    partner_commission_rate NUMERIC(5,2);
    trip_partner_id BIGINT;
BEGIN
    -- Re-fetch necessary info (since we are in a new function call)
    SELECT * INTO trip_record FROM public.trips WHERE trip_id = NEW.trip_id;
    trip_partner_id := trip_record.partner_id;
    SELECT * INTO partner_record FROM public.partners WHERE partner_id = trip_partner_id;
    
    IF partner_record.commission_percentage IS NOT NULL THEN
        partner_commission_rate := partner_record.commission_percentage;
    ELSE
        partner_commission_rate := 10.00;
    END IF;

    -- Insert into Commissions Table
    INSERT INTO public.commissions (
        booking_id,
        partner_id,
        trip_id,
        booking_amount,
        commission_percentage,
        commission_amount,
        partner_revenue,
        status,
        created_at
    ) VALUES (
        NEW.booking_id, -- Safe now, as record exists
        trip_partner_id,
        NEW.trip_id,
        NEW.total_price,
        partner_commission_rate,
        NEW.platform_commission,
        NEW.partner_revenue,
        CASE WHEN NEW.payment_status = 'paid' THEN 'confirmed' ELSE 'pending' END,
        NOW()
    );

    -- Insert into Booking Ledger
    INSERT INTO public.booking_ledger (
        booking_id,
        partner_id,
        entry_type,
        amount,
        note,
        created_at
    ) VALUES (
        NEW.booking_id,
        trip_partner_id,
        'booking',
        NEW.total_price,
        'New Booking Created',
        NOW()
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 4. NOTIFICATIONS: Fix Role and Join (AFTER INSERT OR UPDATE)
CREATE OR REPLACE FUNCTION public.notify_booking_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_trip_info RECORD;
    v_user_fullname TEXT;
    v_partner_admin_id BIGINT; -- Matches public.users.user_id
BEGIN
    
    -- Fetch Trip & Partner Info
    SELECT 
        t.trip_id, 
        p.partner_id, 
        p.company_name,
        r.origin_city,
        r.destination_city
    INTO v_trip_info
    FROM public.trips t
    JOIN public.partners p ON t.partner_id = p.partner_id
    JOIN public.routes r ON t.route_id = r.route_id
    WHERE t.trip_id = COALESCE(NEW.trip_id, OLD.trip_id);

    -- Fetch User Info
    SELECT full_name INTO v_user_fullname 
    FROM public.users 
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);

    -- Fetch Partner Admin
    -- FIX 1: Join using auth_id (UUID) = ur.user_id (UUID)
    -- FIX 2: Use correct role 'partner' instead of 'partner_admin'
    SELECT u.user_id INTO v_partner_admin_id
    FROM public.users u
    JOIN public.user_roles ur ON u.auth_id = ur.user_id
    WHERE u.partner_id = v_trip_info.partner_id
    AND ur.role IN ('admin', 'employee', 'partner')
    LIMIT 1;

    -- Case 1: NEW BOOKING
    IF (TG_OP = 'INSERT') THEN
        
        -- Notify Customer
        INSERT INTO public.notifications (user_id, title, message, type, priority) 
        VALUES (
            NEW.user_id,
            'تم استلام طلبك',
            format('مرحباً %s، تم استلام طلب الحجز الخاص بك لرحلة %s إلى %s وهو قيد المراجعة.', 
                   v_user_fullname, v_trip_info.origin_city, v_trip_info.destination_city),
            'booking',
            'high'
        );

        -- Notify Partner
        IF v_partner_admin_id IS NOT NULL THEN
            INSERT INTO public.notifications (user_id, title, message, type, priority)
            VALUES (
                v_partner_admin_id,
                'طلب حجز جديد',
                format('طلب حجز جديد من %s على رحلة %s - %s.', 
                       v_user_fullname, v_trip_info.origin_city, v_trip_info.destination_city),
                'booking',
                'high'
            );
        END IF;

    -- Case 2: UPDATE
    ELSIF (TG_OP = 'UPDATE') THEN
        IF OLD.booking_status IS DISTINCT FROM NEW.booking_status THEN
            IF NEW.booking_status = 'confirmed' OR NEW.booking_status = 'paid' THEN
                -- Notify Customer
                INSERT INTO public.notifications (user_id, title, message, type, priority)
                VALUES (
                    NEW.user_id,
                    'تم تأكيد الحجز!',
                    format('مبروك! تم تأكيد حجزك للرحلة إلى %s. نتمنى لك سفرة سعيدة.', v_trip_info.destination_city),
                    'booking',
                    'high'
                );
                -- Notify Partner
                IF v_partner_admin_id IS NOT NULL THEN
                    INSERT INTO public.notifications (user_id, title, message, type, priority)
                    VALUES (
                        v_partner_admin_id,
                        'حجز مؤكد',
                        format('تم تأكيد/دفع الحجز رقم #%s للمسافر %s.', NEW.booking_id, v_user_fullname),
                        'booking',
                        'medium'
                    );
                END IF;
            ELSIF NEW.booking_status = 'cancelled' OR NEW.booking_status = 'rejected' THEN
                -- Notify Customer
                INSERT INTO public.notifications (user_id, title, message, type, priority)
                VALUES (
                    NEW.user_id,
                    'تحديث حالة الحجز',
                    'عذراً، تم إلغاء/رفض الحجز الخاص بك. يرجى مراجعة التفاصيل في التطبيق.',
                    'booking',
                    'high'
                );
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. TRIGGERS: Recreate them with correct timing
CREATE TRIGGER trigger_calculate_financials
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_booking_financials();

CREATE TRIGGER trigger_create_commission_records
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.create_commission_records();

CREATE TRIGGER trigger_notify_booking_changes
    AFTER INSERT OR UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_booking_changes();
