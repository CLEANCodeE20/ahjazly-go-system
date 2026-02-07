-- ==============================================================================
-- CONSOLIDATED FIXES: TRIP MONITORING, SEARCH BOOKINGS, AND BUS AVAILABILITY
-- إصلاحات مجمعة: مراقبة الرحلات، بحث الحجوزات، وتوافر الحافلات
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- PART 1: FIX BUS AVAILABILITY (Removal of is_available column dependency)
-- ------------------------------------------------------------------------------

-- 1. Update sync_bus_seats()
CREATE OR REPLACE FUNCTION public.sync_bus_seats()
RETURNS TRIGGER AS $$
DECLARE
    v_cell RECORD;
    v_seat_numbers TEXT[];
BEGIN
    IF (TG_OP = 'INSERT' AND NEW.seat_layout IS NOT NULL) OR 
       (TG_OP = 'UPDATE' AND OLD.seat_layout IS DISTINCT FROM NEW.seat_layout) THEN
        
        FOR v_cell IN 
            SELECT 
                x->>'label' as seat_number,
                x->>'class' as seat_class
            FROM jsonb_array_elements(NEW.seat_layout->'cells') AS x
            WHERE x->>'type' = 'seat' AND (x->>'label') IS NOT NULL
        LOOP
            INSERT INTO public.seats (bus_id, seat_number, price_adjustment_factor)
            VALUES (
                NEW.bus_id, 
                v_cell.seat_number,
                CASE WHEN v_cell.seat_class = 'vip' THEN 1.5 ELSE 1.0 END
            )
            ON CONFLICT (bus_id, seat_number) DO UPDATE
            SET price_adjustment_factor = EXCLUDED.price_adjustment_factor;
        END LOOP;
        
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Update secure_book_seat()
CREATE OR REPLACE FUNCTION public.secure_book_seat(
    _booking_id BIGINT,
    _seat_id BIGINT,
    _trip_id BIGINT
)
RETURNS BOOLEAN AS $$
DECLARE
    seat_already_taken BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.passengers 
        WHERE seat_id = _seat_id AND trip_id = _trip_id AND passenger_status = 'active'
    ) INTO seat_already_taken;

    IF seat_already_taken THEN
        RAISE EXCEPTION 'Seat % for trip % is already taken', _seat_id, _trip_id;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 3. Update get_available_seats()
CREATE OR REPLACE FUNCTION public.get_available_seats(p_trip_id BIGINT)
RETURNS JSONB AS $$
DECLARE
    v_bus_id BIGINT;
    v_blocked_seats JSONB;
    v_seats JSONB;
BEGIN
    SELECT bus_id, COALESCE(blocked_seats, '[]'::jsonb) 
    INTO v_bus_id, v_blocked_seats 
    FROM public.trips 
    WHERE trip_id = p_trip_id;
    
    SELECT jsonb_agg(
        jsonb_build_object(
            'seat_id', s.seat_id,
            'seat_number', s.seat_number,
            'is_available', (
                NOT EXISTS (
                    SELECT 1 FROM public.passengers p 
                    WHERE p.trip_id = p_trip_id AND p.seat_id = s.seat_id AND p.passenger_status = 'active'
                )
                AND NOT (v_blocked_seats @> jsonb_build_array(s.seat_number))
            )
        )
    ) INTO v_seats
    FROM public.seats s
    WHERE s.bus_id = v_bus_id;

    RETURN jsonb_build_object(
        'success', true,
        'seats', COALESCE(v_seats, '[]'::jsonb)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- PART 2: FIX TRIP MONITORING (Add title column & fix 400 errors)
-- ------------------------------------------------------------------------------

-- 1. Add missing 'title' column to notifications table
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS title TEXT;

-- 2. Drop existing functions to allow changing return types
DROP FUNCTION IF EXISTS public.get_trip_notification_stats(INTEGER);
DROP FUNCTION IF EXISTS public.get_automation_execution_log(INTEGER);
DROP FUNCTION IF EXISTS public.search_bookingsv3(TEXT, TEXT, INT, INT, BIGINT);
DROP FUNCTION IF EXISTS public.search_bookingsv3(TEXT, TEXT, INT, INT, INTEGER);

-- 3. Repair get_trip_notification_stats
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
    GROUP BY n.title
    ORDER BY last_sent DESC;
END;
$$;

-- 4. Repair get_automation_execution_log
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
    BEGIN
        SELECT jobid INTO v_job_id FROM cron.job WHERE jobname = 'process-trips-job' LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
        v_job_id := NULL;
    END;

    IF v_job_id IS NULL THEN
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

-- ------------------------------------------------------------------------------
-- PART 3: FIX SEARCH BOOKINGS (Fix types & Add Partner Isolation)
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.search_bookingsv3(
  p_search_query TEXT DEFAULT NULL,
  p_status_filter TEXT DEFAULT NULL,
  p_page INT DEFAULT 1,
  p_page_size INT DEFAULT 10,
  p_partner_id INTEGER DEFAULT NULL
)
RETURNS TABLE (
  booking_id TEXT, -- Changed to TEXT to avoid JS BigInt issues
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
  trip_id TEXT, -- Changed to TEXT to avoid JS BigInt issues
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
      b.booking_id::TEXT, -- Cast to TEXT
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
      b.trip_id::TEXT, -- Cast to TEXT
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

-- ------------------------------------------------------------------------------
-- PART 4: GRANT PERMISSIONS
-- ------------------------------------------------------------------------------

GRANT EXECUTE ON FUNCTION public.sync_bus_seats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.secure_book_seat(BIGINT, BIGINT, BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_available_seats(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_trip_notification_stats(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_automation_execution_log(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_bookingsv3(TEXT, TEXT, INT, INT, INTEGER) TO authenticated;

COMMIT;
