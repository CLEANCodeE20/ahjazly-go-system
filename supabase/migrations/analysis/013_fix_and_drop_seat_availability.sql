-- ============================================
-- سكريبت الجراحة: تعديل الـ View وحذف العمود
-- ============================================

-- 1. تحديث الـ View لإزالة الاعتماد على is_available
CREATE OR REPLACE VIEW public.v_available_trips AS
 SELECT t.trip_id,
    t.departure_time,
    t.arrival_time,
    t.status,
    r.origin_city,
    r.destination_city,
    p.company_name,
    t.base_price,
    (
        CASE
            WHEN (EXISTS ( SELECT 1 FROM seats s WHERE s.bus_id = t.bus_id)) 
            THEN ( SELECT count(*) AS count FROM seats s WHERE s.bus_id = t.bus_id ) -- تم التعديل: إزالة شرط is_available
            ELSE (COALESCE(bu.capacity, 0))::bigint
        END 
        - 
        ( SELECT count(*) AS count FROM passengers pass WHERE pass.trip_id = t.trip_id AND pass.passenger_status::text = 'active'::text)
        - 
        ( SELECT jsonb_array_length(COALESCE(t.blocked_seats, '[]'::jsonb)) AS jsonb_array_length)
    ) AS available_seats,
    (EXTRACT(epoch FROM (t.departure_time - now())) / 60::numeric) AS minutes_until_departure
   FROM trips t
     JOIN routes r ON t.route_id = r.route_id
     JOIN buses bu ON t.bus_id = bu.bus_id
     JOIN partners p ON t.partner_id = p.partner_id
  WHERE t.status = ANY (ARRAY['scheduled'::trip_status, 'in_progress'::trip_status, 'delayed'::trip_status]) 
  AND t.departure_time > (now() + '00:05:00'::interval) 
  AND (
      (
        CASE
            WHEN (EXISTS ( SELECT 1 FROM seats s WHERE s.bus_id = t.bus_id)) 
            THEN ( SELECT count(*) AS count FROM seats s WHERE s.bus_id = t.bus_id ) -- تم التعديل: إزالة شرط is_available
            ELSE (COALESCE(bu.capacity, 0))::bigint
        END 
        - 
        ( SELECT count(*) AS count FROM passengers pass WHERE pass.trip_id = t.trip_id AND pass.passenger_status::text = 'active'::text)
        - 
        ( SELECT jsonb_array_length(COALESCE(t.blocked_seats, '[]'::jsonb)) AS jsonb_array_length)
      ) > 0
  )
  ORDER BY t.departure_time;

-- 2. الآن أصبح من الآمن حذف العمود
ALTER TABLE seats DROP COLUMN is_available;
