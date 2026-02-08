-- ========================================================
-- FIX: Trip Launch Automation
-- Date: 2026-02-08
-- Purpose: إصلاح مشكلة عدم إطلاق الرحلات المجدولة تلقائياً
-- ========================================================

BEGIN;

-- 1. التأكد من تثبيت pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. إعادة إنشاء الدالة مع تحسينات
CREATE OR REPLACE FUNCTION public.process_trip_scheduled_actions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_count_started INTEGER := 0;
    v_count_completed INTEGER := 0;
    v_count_notified_60min INTEGER := 0;
    v_count_notified_30min INTEGER := 0;
    v_count_notified_15min INTEGER := 0;
    v_current_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- الحصول على الوقت الحالي
    v_current_time := NOW();
    
    -- ============================================================
    -- TASK A: Automatic Status Update (Scheduled → In Progress)
    -- ============================================================
    -- تحديث حالة الرحلات من "مجدولة" إلى "قيد التنفيذ"
    WITH updated_trips AS (
        UPDATE public.trips
        SET status = 'in_progress',
            updated_at = v_current_time
        WHERE status = 'scheduled'
          AND departure_time <= (v_current_time + INTERVAL '2 minutes')
        RETURNING trip_id, departure_time
    )
    SELECT count(*) INTO v_count_started FROM updated_trips;

    -- تسجيل في السجلات إذا تم تحديث رحلات
    IF v_count_started > 0 THEN
        RAISE NOTICE 'Trip Automation: % trips started (scheduled → in_progress)', v_count_started;
    END IF;

    -- ============================================================
    -- TASK B: 1-Hour (60-min) Pre-Trip Notifications
    -- ============================================================
    WITH passengers_to_notify_60 AS (
        SELECT DISTINCT 
            b.auth_id, 
            t.trip_id, 
            b.booking_id,
            t.departure_time,
            r.origin_city,
            r.destination_city
        FROM public.bookings b
        JOIN public.trips t ON b.trip_id = t.trip_id
        JOIN public.routes r ON t.route_id = r.route_id
        WHERE b.booking_status = 'confirmed'
          AND t.status = 'scheduled'
          AND t.departure_time BETWEEN (v_current_time + INTERVAL '55 minutes') 
                                   AND (v_current_time + INTERVAL '65 minutes')
          AND NOT EXISTS (
              SELECT 1 FROM public.notifications n
              WHERE n.related_booking_id = b.booking_id
                AND n.title = 'تذكير: رحلتك خلال ساعة'
          )
    ),
    inserted_60 AS (
        INSERT INTO public.notifications (auth_id, title, message, related_booking_id, type, priority)
        SELECT 
            auth_id,
            'تذكير: رحلتك خلال ساعة',
            format('تذكير: موعد انطلاق رحلتك رقم #%s من %s إلى %s هو خلال ساعة واحدة (%s). يرجى التواجد في المحطة قبل الموعد.', 
                   trip_id, origin_city, destination_city, to_char(departure_time, 'HH24:MI')),
            booking_id,
            'trip'::notification_type,
            'high'
        FROM passengers_to_notify_60
        RETURNING notification_id
    )
    SELECT count(*) INTO v_count_notified_60min FROM inserted_60;

    -- ============================================================
    -- TASK C: 30-Minute Pre-Trip Notifications
    -- ============================================================
    WITH passengers_to_notify_30 AS (
        SELECT DISTINCT 
            b.auth_id, 
            t.trip_id, 
            b.booking_id,
            t.departure_time,
            r.origin_city,
            r.destination_city
        FROM public.bookings b
        JOIN public.trips t ON b.trip_id = t.trip_id
        JOIN public.routes r ON t.route_id = r.route_id
        WHERE b.booking_status = 'confirmed'
          AND t.status = 'scheduled'
          AND t.departure_time BETWEEN (v_current_time + INTERVAL '28 minutes') 
                                   AND (v_current_time + INTERVAL '32 minutes')
          AND NOT EXISTS (
              SELECT 1 FROM public.notifications n
              WHERE n.related_booking_id = b.booking_id
                AND n.title = 'تذكير: رحلتك خلال 30 دقيقة'
          )
    ),
    inserted_30 AS (
        INSERT INTO public.notifications (auth_id, title, message, related_booking_id, type, priority)
        SELECT 
            auth_id,
            'تذكير: رحلتك خلال 30 دقيقة',
            format('⏰ رحلتك من %s إلى %s ستنطلق خلال 30 دقيقة فقط! الموعد: %s. تأكد من وجودك في المحطة الآن.', 
                   origin_city, destination_city, to_char(departure_time, 'HH24:MI')),
            booking_id,
            'trip'::notification_type,
            'urgent'
        FROM passengers_to_notify_30
        RETURNING notification_id
    )
    SELECT count(*) INTO v_count_notified_30min FROM inserted_30;

    -- ============================================================
    -- TASK D: 15-Minute Pre-Trip Notifications
    -- ============================================================
    WITH passengers_to_notify_15 AS (
        SELECT DISTINCT 
            b.auth_id, 
            t.trip_id, 
            b.booking_id,
            t.departure_time,
            r.origin_city,
            r.destination_city
        FROM public.bookings b
        JOIN public.trips t ON b.trip_id = t.trip_id
        JOIN public.routes r ON t.route_id = r.route_id
        WHERE b.booking_status = 'confirmed'
          AND t.status = 'scheduled'
          AND t.departure_time BETWEEN (v_current_time + INTERVAL '13 minutes') 
                                   AND (v_current_time + INTERVAL '17 minutes')
          AND NOT EXISTS (
              SELECT 1 FROM public.notifications n
              WHERE n.related_booking_id = b.booking_id
                AND n.title = 'عاجل: رحلتك خلال 15 دقيقة'
          )
    ),
    inserted_15 AS (
        INSERT INTO public.notifications (auth_id, title, message, related_booking_id, type, priority)
        SELECT 
            auth_id,
            'عاجل: رحلتك خلال 15 دقيقة',
            format('🚨 رحلتك من %s إلى %s ستنطلق خلال 15 دقيقة! إذا لم تكن في المحطة، يرجى الإسراع.', 
                   origin_city, destination_city),
            booking_id,
            'trip'::notification_type,
            'urgent'
        FROM passengers_to_notify_15
        RETURNING notification_id
    )
    SELECT count(*) INTO v_count_notified_15min FROM inserted_15;

    -- ============================================================
    -- TASK E: Auto-Complete Trips
    -- ============================================================
    WITH completed_trips AS (
        UPDATE public.trips
        SET status = 'completed',
            updated_at = v_current_time
        WHERE status = 'in_progress'
          AND arrival_time IS NOT NULL
          AND arrival_time <= (v_current_time - INTERVAL '30 minutes')
        RETURNING trip_id
    )
    SELECT count(*) INTO v_count_completed FROM completed_trips;

    -- إرسال إشعارات الشكر للرحلات المكتملة
    IF v_count_completed > 0 THEN
        INSERT INTO public.notifications (auth_id, title, message, related_booking_id, type, priority)
        SELECT DISTINCT
            b.auth_id,
            'شكراً لاختيارك خدماتنا',
            format('نشكرك على استخدام خدماتنا في رحلتك من %s إلى %s. نتمنى أن تكون قد استمتعت برحلتك. يرجى تقييم تجربتك.', 
                   r.origin_city, r.destination_city),
            b.booking_id,
            'trip'::notification_type,
            'normal'
        FROM public.bookings b
        JOIN public.trips t ON b.trip_id = t.trip_id
        JOIN public.routes r ON t.route_id = r.route_id
        WHERE t.status = 'completed'
          AND t.updated_at >= v_current_time - INTERVAL '2 minutes'
          AND b.booking_status = 'confirmed'
          AND NOT EXISTS (
              SELECT 1 FROM public.notifications n
              WHERE n.related_booking_id = b.booking_id
                AND n.title = 'شكراً لاختيارك خدماتنا'
          );
        
        RAISE NOTICE 'Trip Automation: % trips completed', v_count_completed;
    END IF;

    -- تسجيل الإشعارات المرسلة
    IF (v_count_notified_60min + v_count_notified_30min + v_count_notified_15min) > 0 THEN
        RAISE NOTICE 'Trip Automation: Notifications sent - 60min: %, 30min: %, 15min: %', 
            v_count_notified_60min, v_count_notified_30min, v_count_notified_15min;
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error in process_trip_scheduled_actions: % %', SQLERRM, SQLSTATE;
END;
$$;

-- 3. منح الصلاحيات اللازمة
GRANT USAGE ON SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT EXECUTE ON FUNCTION public.process_trip_scheduled_actions() TO postgres;

-- 4. إلغاء جدولة الوظيفة القديمة إن وجدت
DO $$ 
BEGIN
    PERFORM cron.unschedule('process-trips-job');
EXCEPTION 
    WHEN OTHERS THEN 
        NULL; -- تجاهل الخطأ إذا لم تكن الوظيفة موجودة
END $$;

-- 5. جدولة الوظيفة الجديدة (كل دقيقة)
SELECT cron.schedule(
    'process-trips-job',
    '* * * * *',  -- كل دقيقة
    'SELECT public.process_trip_scheduled_actions()'
);

-- 6. تحديث أي رحلات متأخرة يدوياً (لمرة واحدة)
DO $$
DECLARE
    v_updated_count INTEGER;
BEGIN
    WITH updated AS (
        UPDATE public.trips
        SET status = 'in_progress',
            updated_at = NOW()
        WHERE status = 'scheduled'
          AND departure_time <= NOW()
        RETURNING trip_id
    )
    SELECT count(*) INTO v_updated_count FROM updated;
    
    IF v_updated_count > 0 THEN
        RAISE NOTICE '✓ Updated % delayed trips to in_progress status', v_updated_count;
    END IF;
END $$;

COMMIT;

-- 7. عرض رسالة النجاح
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ TRIP LAUNCH AUTOMATION FIXED';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Features:';
    RAISE NOTICE '  ✓ pg_cron extension enabled';
    RAISE NOTICE '  ✓ Auto launch (scheduled → in_progress)';
    RAISE NOTICE '  ✓ 60-minute pre-trip notifications';
    RAISE NOTICE '  ✓ 30-minute pre-trip notifications';
    RAISE NOTICE '  ✓ 15-minute pre-trip notifications';
    RAISE NOTICE '  ✓ Auto-completion of trips';
    RAISE NOTICE '  ✓ Cron job scheduled (every minute)';
    RAISE NOTICE '========================================';
END $$;
