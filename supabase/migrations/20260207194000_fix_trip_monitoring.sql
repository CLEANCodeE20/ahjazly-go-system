-- =============================================
-- FIX TRIP MONITORING FUNCTIONS & NOTIFICATIONS TABLE
-- إصلاح وظائف المراقبة وجدول الإشعارات
-- =============================================

BEGIN;

-- 1. Add missing 'title' column to notifications table
-- This is needed by both the frontend (useNotifications.ts) and the monitoring functions
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS title TEXT;

-- 2. Drop existing functions to allow changing return types
DROP FUNCTION IF EXISTS public.get_trip_notification_stats(INTEGER);
DROP FUNCTION IF EXISTS public.get_automation_execution_log(INTEGER);

-- 3. Repair get_trip_notification_stats
-- Fix column names: 'title' is now added, but we'll use COALESCE just in case.
-- Fix timestamp: 'sent_at' is used instead of 'created_at'.
CREATE OR REPLACE FUNCTION public.get_trip_notification_stats(p_hours INTEGER DEFAULT 24)
RETURNS TABLE (
    notification_type TEXT,
    count BIGINT,
    last_sent TIMESTAMP
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(n.title, 'إشعار رحلة') AS notification_type,
        COUNT(*) AS count,
        MAX(n.sent_at) AS last_sent
    FROM public.notifications n
    WHERE n.type = 'trip'
      AND n.sent_at >= NOW() - (p_hours || ' hours')::INTERVAL
      AND (
          n.title IN (
              'تذكير: رحلتك خلال ساعة',
              'تذكير: رحلتك خلال 30 دقيقة',
              'عاجل: رحلتك خلال 15 دقيقة',
              'بدأت الرحلة 🚌',
              'شكراً لاختيارك خدماتنا'
          )
          OR n.message LIKE '%رحلتك%' -- Fallback for untitled notifications
      )
    GROUP BY n.title
    ORDER BY last_sent DESC;
END;
$$;

-- 3. Repair get_automation_execution_log
-- Ensure robust handling if pg_cron or the process-trips-job is missing
CREATE OR REPLACE FUNCTION public.get_automation_execution_log(p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
    run_id BIGINT,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    status TEXT,
    return_message TEXT,
    duration_seconds NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_job_id BIGINT;
BEGIN
    -- Try to find the job ID safely
    BEGIN
        SELECT jobid INTO v_job_id FROM cron.job WHERE jobname = 'process-trips-job' LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
        v_job_id := NULL;
    END;

    IF v_job_id IS NULL THEN
        -- Return empty result if job doesn't exist to avoid 400/500 errors
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        jrd.runid,
        jrd.start_time,
        jrd.end_time,
        jrd.status,
        jrd.return_message,
        ROUND(EXTRACT(EPOCH FROM (jrd.end_time - jrd.start_time))::NUMERIC, 2) AS duration_seconds
    FROM cron.job_run_details jrd
    WHERE jrd.jobid = v_job_id
    ORDER BY jrd.start_time DESC
    LIMIT p_limit;
END;
$$;

-- 4. Create search_bookingsv3 (Fixes BIGINT types & Adds Partner Isolation)
CREATE OR REPLACE FUNCTION public.search_bookingsv3(
  p_search_query TEXT DEFAULT NULL,
  p_status_filter TEXT DEFAULT NULL,
  p_page INT DEFAULT 1,
  p_page_size INT DEFAULT 10,
  p_partner_id BIGINT DEFAULT NULL
)
RETURNS TABLE (
  booking_id BIGINT,
  booking_date TIMESTAMP,
  booking_status TEXT,
  payment_status TEXT,
  total_price NUMERIC,
  payment_method TEXT,
  platform_commission NUMERIC,
  partner_revenue NUMERIC,
  gateway_transaction_id TEXT,
  payment_timestamp TIMESTAMP,
  auth_id UUID,
  trip_id BIGINT,
  user_full_name TEXT,
  user_phone_number TEXT,
  trip_departure_time TIMESTAMP,
  origin_city TEXT,
  destination_city TEXT,
  total_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_offset INT;
BEGIN
  v_offset := (p_page - 1) * p_page_size;
  
  RETURN QUERY
  WITH filtered_bookings AS (
    SELECT 
      b.booking_id,
      b.booking_date,
      b.booking_status::TEXT,
      b.payment_status::TEXT,
      b.total_price,
      b.payment_method::TEXT,
      b.platform_commission,
      b.partner_revenue,
      b.gateway_transaction_id,
      b.payment_timestamp,
      b.auth_id,
      b.trip_id,
      u.full_name AS user_full_name,
      u.phone_number AS user_phone_number,
      t.departure_time AS trip_departure_time,
      r.origin_city,
      r.destination_city,
      COUNT(*) OVER() AS total_count
    FROM bookings b
    LEFT JOIN users u ON b.auth_id = u.auth_id
    LEFT JOIN trips t ON b.trip_id = t.trip_id
    LEFT JOIN routes r ON t.route_id = r.route_id
    WHERE 
      (p_partner_id IS NULL OR r.partner_id = p_partner_id)
      AND
      (p_status_filter IS NULL OR p_status_filter = 'all' OR 
       b.booking_status::TEXT = p_status_filter)
      AND
      (
        p_search_query IS NULL 
        OR p_search_query = '' 
        OR b.booking_id::TEXT ILIKE '%' || p_search_query || '%'
        OR u.full_name ILIKE '%' || p_search_query || '%'
        OR u.phone_number ILIKE '%' || p_search_query || '%'
      )
    ORDER BY b.booking_id DESC
    LIMIT p_page_size
    OFFSET v_offset
  )
  SELECT * FROM filtered_bookings;
END;
$$;

-- 5. Re-grant permissions
GRANT EXECUTE ON FUNCTION public.get_trip_notification_stats(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_automation_execution_log(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_bookingsv3(TEXT, TEXT, INT, INT, BIGINT) TO authenticated;

COMMIT;
