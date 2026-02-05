-- =============================================
-- DIAGNOSTIC QUERIES FOR TRIP SEARCH
-- =============================================

-- 1. Check if we have any partners
SELECT 'Partners Count' as check_name, COUNT(*) as count FROM public.partners;

-- 2. Check if we have any bus classes
SELECT 'Bus Classes' as check_name, class_name FROM public.bus_classes;

-- 3. Check if we have any buses
SELECT 'Buses Count' as check_name, COUNT(*) as count FROM public.buses;

-- 4. Check if we have any routes
SELECT 'Routes' as check_name, route_id, origin_city, destination_city FROM public.routes;

-- 5. Check if we have any route stops
SELECT 'Route Stops Count' as check_name, COUNT(*) as count FROM public.route_stops;

-- 6. Check if we have any trips
SELECT 'Trips Count' as check_name, COUNT(*) as count FROM public.trips;

-- 7. Detailed trip information with all joins
SELECT 
    t.trip_id,
    t.departure_time,
    r.origin_city,
    r.destination_city,
    bc.class_name as bus_class,
    p.company_name as partner,
    b.model as bus_model,
    t.base_price
FROM public.trips t
LEFT JOIN public.routes r ON t.route_id = r.route_id
LEFT JOIN public.buses b ON t.bus_id = b.bus_id
LEFT JOIN public.bus_classes bc ON b.bus_class_id = bc.bus_class_id
LEFT JOIN public.partners p ON t.partner_id = p.partner_id
ORDER BY t.trip_id DESC
LIMIT 10;

-- 8. Check route stops for each route
SELECT 
    r.route_id,
    r.origin_city,
    r.destination_city,
    rs.stop_name,
    rs.stop_order
FROM public.routes r
LEFT JOIN public.route_stops rs ON r.route_id = rs.route_id
ORDER BY r.route_id, rs.stop_order;

-- 9. Test search_trips RPC directly
SELECT * FROM public.search_trips(
    _from_stop := 'صنعاء',
    _to_city := 'عدن',
    _date := CURRENT_DATE + INTERVAL '1 day',
    _bus_class := 'VIP'
);

-- 10. Alternative test with English names
SELECT * FROM public.search_trips(
    _from_stop := 'Sanaa',
    _to_city := 'Aden',
    _date := CURRENT_DATE + INTERVAL '1 day',
    _bus_class := 'VIP'
);
