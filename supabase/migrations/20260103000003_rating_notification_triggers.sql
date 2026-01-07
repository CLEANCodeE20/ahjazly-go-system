-- =============================================
-- RATING SYSTEM NOTIFICATION TRIGGERS
-- محفزات الإشعارات لنظام التقييم
-- =============================================

-- =============================================
-- TRIGGER 1: Notify partner when rating received
-- إشعار الشريك عند استلام تقييم جديد
-- =============================================

CREATE OR REPLACE FUNCTION public.notify_partner_on_new_rating()
RETURNS TRIGGER AS $$
DECLARE
    v_trip_info TEXT;
    v_notification_message TEXT;
BEGIN
    -- Get trip information
    SELECT 
        r.origin_city || ' - ' || r.destination_city
    INTO v_trip_info
    FROM public.trips t
    JOIN public.routes r ON t.route_id = r.route_id
    WHERE t.trip_id = NEW.trip_id;
    
    -- Create notification message based on rating
    IF NEW.stars >= 4 THEN
        v_notification_message := 'تم استلام تقييم إيجابي (' || NEW.stars || ' نجوم) للرحلة: ' || v_trip_info;
    ELSIF NEW.stars = 3 THEN
        v_notification_message := 'تم استلام تقييم متوسط (3 نجوم) للرحلة: ' || v_trip_info;
    ELSE
        v_notification_message := 'تنبيه: تم استلام تقييم منخفض (' || NEW.stars || ' نجوم) للرحلة: ' || v_trip_info || ' - يرجى المتابعة';
    END IF;
    
    -- Send notification to all partner users
    INSERT INTO public.notifications (user_id, type, message, related_booking_id)
    SELECT 
        u.user_id,
        'trip',
        v_notification_message,
        NEW.booking_id
    FROM public.users u
    WHERE u.partner_id = NEW.partner_id
    AND u.user_type IN ('partner', 'employee')
    AND u.account_status = 'active';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS notify_partner_on_rating_trigger ON public.ratings;

CREATE TRIGGER notify_partner_on_rating_trigger
    AFTER INSERT ON public.ratings
    FOR EACH ROW EXECUTE FUNCTION public.notify_partner_on_new_rating();

COMMENT ON FUNCTION public.notify_partner_on_new_rating IS 'إرسال إشعار للشريك عند استلام تقييم جديد';

-- =============================================
-- TRIGGER 2: Notify user to rate trip after completion
-- إشعار المستخدم لتقييم الرحلة بعد اكتمالها
-- =============================================

-- =============================================
-- TRIGGER 2: Notify user to rate trip after completion
-- إشعار المستخدم لتقييم الرحلة بعد اكتمالها
-- =============================================

CREATE OR REPLACE FUNCTION public.notify_user_to_rate_trip()
RETURNS TRIGGER AS $$
DECLARE
    v_trip_info TEXT;
    v_notification_message TEXT;
    v_rating_exists BOOLEAN;
BEGIN
    -- Only trigger when booking status changes to completed
    IF NEW.booking_status = 'completed' AND (OLD.booking_status IS NULL OR OLD.booking_status != 'completed') THEN
        
        -- Check if rating already exists (to avoid duplicate notifications if updated multiple times)
        SELECT EXISTS (
            SELECT 1 FROM public.ratings r 
            WHERE r.booking_id = NEW.booking_id
        ) INTO v_rating_exists;

        IF NOT v_rating_exists THEN
            -- Get trip information
            SELECT 
                r.origin_city || ' - ' || r.destination_city
            INTO v_trip_info
            FROM public.trips t
            JOIN public.routes r ON t.route_id = r.route_id
            WHERE t.trip_id = NEW.trip_id;
            
            v_notification_message := 'شكراً لاستخدامك خدماتنا! يرجى تقييم رحلتك: ' || COALESCE(v_trip_info, 'رحلة');
            
            -- Send notification to the user
            INSERT INTO public.notifications (user_id, type, message, related_booking_id)
            VALUES (
                NEW.user_id,
                'trip',
                v_notification_message,
                NEW.booking_id
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS notify_user_to_rate_trip_trigger ON public.bookings;
DROP TRIGGER IF EXISTS notify_user_to_rate_trip_trigger ON public.trips; -- Drop old trigger if exists

CREATE TRIGGER notify_user_to_rate_trip_trigger
    AFTER UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_user_to_rate_trip();

COMMENT ON FUNCTION public.notify_user_to_rate_trip IS 'إرسال إشعار للمستخدمين لتقييم الرحلة بعد اكتمالها';

-- =============================================
-- TRIGGER 3: Notify user when partner responds
-- إشعار المستخدم عند رد الشريك على التقييم
-- =============================================

CREATE OR REPLACE FUNCTION public.notify_user_on_rating_response()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id BIGINT;
    v_notification_message TEXT;
BEGIN
    -- Get the user who made the rating
    SELECT user_id INTO v_user_id
    FROM public.ratings
    WHERE rating_id = NEW.rating_id;
    
    v_notification_message := 'تم الرد على تقييمك من قبل الشريك';
    
    -- Send notification to the user
    INSERT INTO public.notifications (user_id, type, message)
    VALUES (v_user_id, 'trip', v_notification_message);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS notify_user_on_response_trigger ON public.rating_responses;

CREATE TRIGGER notify_user_on_response_trigger
    AFTER INSERT ON public.rating_responses
    FOR EACH ROW EXECUTE FUNCTION public.notify_user_on_rating_response();

COMMENT ON FUNCTION public.notify_user_on_rating_response IS 'إرسال إشعار للمستخدم عند رد الشريك على تقييمه';

-- =============================================
-- TRIGGER 4: Notify admin on high report count
-- إشعار الإدارة عند زيادة عدد البلاغات
-- =============================================

CREATE OR REPLACE FUNCTION public.notify_admin_on_rating_reports()
RETURNS TRIGGER AS $$
DECLARE
    v_report_count INTEGER;
    v_notification_message TEXT;
BEGIN
    -- Get total report count for this rating
    SELECT COUNT(*) INTO v_report_count
    FROM public.rating_reports
    WHERE rating_id = NEW.rating_id
    AND status = 'pending';
    
    -- Notify admin if report count reaches threshold (e.g., 3)
    IF v_report_count >= 3 THEN
        v_notification_message := 'تنبيه: تقييم رقم ' || NEW.rating_id || ' تم الإبلاغ عنه ' || v_report_count || ' مرات - يحتاج مراجعة';
        
        -- Send notification to all admin users
        INSERT INTO public.notifications (user_id, type, message)
        SELECT 
            u.user_id,
            'system',
            v_notification_message
        FROM public.users u
        WHERE u.user_type = 'admin'
        AND u.account_status = 'active';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS notify_admin_on_reports_trigger ON public.rating_reports;

CREATE TRIGGER notify_admin_on_reports_trigger
    AFTER INSERT ON public.rating_reports
    FOR EACH ROW EXECUTE FUNCTION public.notify_admin_on_rating_reports();

COMMENT ON FUNCTION public.notify_admin_on_rating_reports IS 'إرسال إشعار للإدارة عند زيادة عدد البلاغات على تقييم معين';
