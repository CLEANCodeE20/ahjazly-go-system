-- Fix notify_booking_changes to use user_roles table instead of u.role column

CREATE OR REPLACE FUNCTION public.notify_booking_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_trip_info RECORD;
    v_user_fullname TEXT;
    v_partner_admin_id BIGINT; -- Using BIGINT to match public.users.user_id
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

    -- Fetch ONE Admin User ID for the Partner to notify him
    -- FIXED: Join with user_roles using auth_id (UUID) because user_roles.user_id is auth_id
    SELECT u.user_id INTO v_partner_admin_id
    FROM public.users u
    JOIN public.user_roles ur ON u.auth_id = ur.user_id
    WHERE u.partner_id = v_trip_info.partner_id
    AND ur.role IN ('admin', 'employee', 'partner')
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
            'booking_update',
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
                'booking_update',
                'high'
            );
        END IF;

    -- ====================================================
    -- CASE 2: STATUS CHANGE (UPDATE)
    -- ====================================================
    ELSIF (TG_OP = 'UPDATE') THEN
        
        -- Check if status changed
        IF OLD.booking_status IS DISTINCT FROM NEW.booking_status THEN
            
            -- Only notify if status is meaningful (e.g. Confirmed, Cancelled)
            IF NEW.booking_status = 'confirmed' OR NEW.booking_status = 'paid' THEN
                 
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
                    'booking_update',
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
                        'booking_update',
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
                    'booking_update',
                    'high'
                );

            END IF;

        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
