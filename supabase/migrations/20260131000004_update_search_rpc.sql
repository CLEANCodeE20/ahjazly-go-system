-- ==========================================================
-- GOLD STANDARD RPC UPDATES (Phase 3.1)
-- Date: 2026-01-31
-- Purpose: Upgrading search functions to use UUID
-- ==========================================================

BEGIN;

-- 1. Create Future-Proof Search Bookings Function
-- ==========================================================
DROP FUNCTION IF EXISTS public.search_bookings(TEXT, TEXT, INT, INT);

CREATE OR REPLACE FUNCTION public.search_bookingsv2(
  p_search_query TEXT DEFAULT NULL,
  p_status_filter TEXT DEFAULT NULL,
  p_page INT DEFAULT 1,
  p_page_size INT DEFAULT 10
)
RETURNS TABLE (
  booking_id INT,
  booking_date TIMESTAMP WITH TIME ZONE,
  booking_status TEXT,
  payment_status TEXT,
  total_price NUMERIC,
  payment_method TEXT,
  platform_commission NUMERIC,
  partner_revenue NUMERIC,
  gateway_transaction_id TEXT,
  payment_timestamp TIMESTAMP WITH TIME ZONE,
  auth_id UUID, -- Switched from user_id BigInt to auth_id UUID
  trip_id INT,
  user_full_name TEXT,
  user_phone_number TEXT,
  trip_departure_time TIMESTAMP WITH TIME ZONE,
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
      b.booking_status,
      b.payment_status,
      b.total_price,
      b.payment_method::TEXT,
      b.platform_commission,
      b.partner_revenue,
      b.gateway_transaction_id,
      b.payment_timestamp,
      b.auth_id, -- Now referencing the UUID column
      b.trip_id,
      u.full_name AS user_full_name,
      u.phone_number AS user_phone_number,
      t.departure_time AS trip_departure_time,
      r.origin_city,
      r.destination_city,
      COUNT(*) OVER() AS total_count
    FROM bookings b
    LEFT JOIN users u ON b.auth_id = u.auth_id -- Join through UUID (Gold Standard)
    LEFT JOIN trips t ON b.trip_id = t.trip_id
    LEFT JOIN routes r ON t.route_id = r.route_id
    WHERE 
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

GRANT EXECUTE ON FUNCTION public.search_bookingsv2 TO authenticated;

COMMIT;
