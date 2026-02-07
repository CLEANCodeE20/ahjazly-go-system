-- ========================================================
-- AUTOMATED BOOKING NOTIFICATIONS TRIGGER
-- ========================================================

-- This trigger monitors the bookings table and automatically 
-- inserts notification records when:
-- 1. A new booking is created (Notify User & Company)
-- 2. Booking status changes (Notify User & Company)

CREATE OR REPLACE FUNCTION public.notify_booking_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_trip_info RECORD;
    v_user_fullname TEXT;
    v_partner_admin_id BIGINT;
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

    -- Fetch User Info (The one who booked)
    SELECT full_name INTO v_user_fullname 
    FROM public.users 
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);

    -- Fetch ONE Admin User ID for the Partner to notify him (Simplification)
    -- In a real scenario, you might notify all admins or check a permissions table
    -- For now, we try to find a user linked to this partner who is an employee/admin
    -- Or we might skip company notification if we can't pin it to a user_id
    -- assuming 'notifications' table REQUIRES a user_id.
    
    -- Attempt to find an admin for this partner (Limit 1)
    SELECT ur.user_id INTO v_partner_admin_id
    FROM public.user_roles ur
    WHERE ur.partner_id = v_trip_info.partner_id
    AND ur.role IN ('admin', 'employee')
    LIMIT 1;


    -- ====================================================
    -- CASE 1: NEW BOOKING (INSERT)
    -- ====================================================
    IF (TG_OP = 'INSERT') THEN
        
        -- 1. Notify the Customer (User)
        INSERT INTO public.notifications (
            user_id,
            title,
            message,
            type,
            priority
        ) VALUES (
            NEW.user_id,
            'تم استلام طلبك',
            format('مرحباً %s، تم استلام طلب الحجز الخاص بك لرحلة %s إلى %s وهو قيد المراجعة.', 
                   v_user_fullname, v_trip_info.origin_city, v_trip_info.destination_city),
            'booking',
            'high'
        );

        -- 2. Notify the Partner (Company Admin)
        IF v_partner_admin_id IS NOT NULL THEN
            INSERT INTO public.notifications (
                user_id,
                title,
                message,
                type,
                priority
            ) VALUES (
                v_partner_admin_id,
                'طلب حجز جديد',
                format('طلب حجز جديد من %s على رحلة %s - %s.', 
                       v_user_fullname, v_trip_info.origin_city, v_trip_info.destination_city),
                'booking',
                'high'
            );
        END IF;

    -- ====================================================
    -- CASE 2: STATUS CHANGE (UPDATE)
    -- ====================================================
    ELSIF (TG_OP = 'UPDATE') THEN
        
        -- Check if status or payment changed
        IF OLD.booking_status IS DISTINCT FROM NEW.booking_status OR OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
            
            -- Only notify if status is meaningful (e.g. Confirmed, Paid, Cancelled)
            IF NEW.booking_status = 'confirmed' OR NEW.payment_status = 'paid' THEN
                 
                -- Notify Customer
                INSERT INTO public.notifications (
                    user_id,
                    title,
                    message,
                    type,
                    priority
                ) VALUES (
                    NEW.user_id,
                    'تم تأكيد الحجز!',
                    format('مبروك! تم تأكيد حجزك للرحلة إلى %s. نتمنى لك سفرة سعيدة.', v_trip_info.destination_city),
                    'booking',
                    'high'
                );

                 -- Notify Partner
                IF v_partner_admin_id IS NOT NULL THEN
                    INSERT INTO public.notifications (
                        user_id,
                        title,
                        message,
                        type,
                        priority
                    ) VALUES (
                        v_partner_admin_id,
                        'حجز مؤكد',
                        format('تم تأكيد/دفع الحجز رقم #%s للمسافر %s.', NEW.booking_id, v_user_fullname),
                        'booking',
                        'medium'
                    );
                END IF;

            ELSIF NEW.booking_status = 'cancelled' OR NEW.booking_status = 'rejected' THEN
                
                -- Notify Customer
                INSERT INTO public.notifications (
                    user_id,
                    title,
                    message,
                    type,
                    priority
                ) VALUES (
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

-- Create Trigger
DROP TRIGGER IF EXISTS trigger_notify_booking_changes ON public.bookings;

CREATE TRIGGER trigger_notify_booking_changes
    AFTER INSERT OR UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_booking_changes();
