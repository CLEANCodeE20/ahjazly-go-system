-- ==========================================================
-- CONSOLIDATED BOOKING RPC FIX & DE-OVERLOADING
-- Date: 2026-02-08
-- Purpose: Remove conflicting signatures (BIGINT vs INTEGER) for 
--          critical booking RPCs that cause 400 Bad Request errors.
-- ==========================================================

BEGIN;

-- 1. DROP ALL CONFLICTING CANDIDATES FOR search_bookingsv3
DROP FUNCTION IF EXISTS public.search_bookingsv3(text, text, integer, integer, bigint);
DROP FUNCTION IF EXISTS public.search_bookingsv3(text, text, integer, integer, integer);
DROP FUNCTION IF EXISTS public.search_bookingsv3(text, text, int, int, bigint);
DROP FUNCTION IF EXISTS public.search_bookingsv3(text, text, int, int, integer);

-- 2. RECREATE search_bookingsv3 (The Gold Standard)
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
    FROM public.bookings b
    LEFT JOIN public.users u ON b.auth_id = u.auth_id
    LEFT JOIN public.trips t ON b.trip_id = t.trip_id
    LEFT JOIN public.routes r ON t.route_id = r.route_id
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
        OR b.gateway_transaction_id ILIKE '%' || p_search_query || '%'
      )
    ORDER BY b.booking_id DESC
    LIMIT p_page_size
    OFFSET v_offset
  )
  SELECT * FROM filtered_bookings;
END;
$$;

-- 3. DROP ALL CONFLICTING CANDIDATES FOR update_booking_status_v3
DROP FUNCTION IF EXISTS public.update_booking_status_v3(bigint, text, text);
DROP FUNCTION IF EXISTS public.update_booking_status_v3(bigint, public.booking_status, text);

-- 4. RECREATE update_booking_status_v3
CREATE OR REPLACE FUNCTION public.update_booking_status_v3(
    p_booking_id BIGINT,
    p_new_status public.booking_status,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_old_status TEXT;
    v_user_auth_id UUID := auth.uid();
    v_employee_id INTEGER := NULL;
BEGIN
    -- 1. Get current status and verify existence
    SELECT booking_status::TEXT INTO v_old_status 
    FROM public.bookings 
    WHERE booking_id = p_booking_id;

    IF v_old_status IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Booking not found');
    END IF;

    -- 2. Identify the active employee/admin making the change (Fixed to use auth_id directly)
    SELECT e.employee_id INTO v_employee_id 
    FROM public.employees e
    JOIN public.users u ON e.auth_id = u.auth_id
    WHERE u.auth_id = v_user_auth_id;

    -- 3. Perform the update
    UPDATE public.bookings 
    SET 
        booking_status = p_new_status,
        cancel_reason = CASE WHEN p_new_status::TEXT IN ('cancelled', 'rejected') THEN p_notes ELSE cancel_reason END,
        cancel_timestamp = CASE WHEN p_new_status::TEXT IN ('cancelled', 'rejected') THEN now() ELSE cancel_timestamp END
    WHERE booking_id = p_booking_id;

    -- Update passengers status
    IF p_new_status::TEXT IN ('cancelled', 'rejected') THEN
        UPDATE public.passengers 
        SET passenger_status = 'cancelled'
        WHERE booking_id = p_booking_id;
    END IF;

    -- 4. Log the action in booking_approvals
    INSERT INTO public.booking_approvals (
        booking_id,
        employee_id,
        action_type,
        old_status,
        new_status,
        notes
    ) VALUES (
        p_booking_id,
        v_employee_id,
        CASE 
            WHEN p_new_status::TEXT = 'confirmed' THEN 'approve'
            WHEN p_new_status::TEXT IN ('cancelled', 'rejected') THEN 'reject'
            ELSE 'update'
        END,
        v_old_status,
        p_new_status::TEXT,
        p_notes
    );

    RETURN jsonb_build_object(
        'success', true, 
        'booking_id', p_booking_id, 
        'new_status', p_new_status::TEXT
    );
END;
$$;

-- 5. RE-GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION public.search_bookingsv3(TEXT, TEXT, INT, INT, BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_booking_status_v3(BIGINT, public.booking_status, TEXT) TO authenticated;

COMMIT;
