
CREATE OR REPLACE FUNCTION public.get_trip_debug_info()
RETURNS TABLE (
  trip_id bigint,
  dep_time timestamp without time zone,
  origin varchar,
  dest varchar,
  bus_class varchar,
  partner varchar
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.trip_id, 
    t.departure_time, 
    COALESCE(r.origin_city, 'MISSING_ROUTE'), 
    COALESCE(r.destination_city, 'MISSING_ROUTE'), 
    COALESCE(bc.class_name, 'MISSING_BUS_CLASS'),
    COALESCE(p.company_name, 'MISSING_PARTNER')
  FROM public.trips t
  LEFT JOIN public.routes r ON t.route_id = r.route_id
  LEFT JOIN public.buses bu ON t.bus_id = bu.bus_id
  LEFT JOIN public.bus_classes bc ON bu.bus_class_id = bc.bus_class_id
  LEFT JOIN public.partners p ON t.partner_id = p.partner_id
  ORDER BY t.trip_id DESC
  LIMIT 5;
END;
$$;
