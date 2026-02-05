-- =============================================
-- CHECK SEATS SCRIPT
-- فحص توفر المقاعد للرحلة رقم 15
-- =============================================

SELECT 
    'Seat Check' as info,
    t.trip_id,
    b.bus_id,
    b.capacity,
    (SELECT COUNT(*) FROM public.seats s WHERE s.bus_id = t.bus_id) as total_seats_defined,
    (SELECT COUNT(*) FROM public.seats s WHERE s.bus_id = t.bus_id AND s.is_available = true) as active_seats,
    (SELECT COUNT(*) FROM public.passengers p WHERE p.trip_id = t.trip_id AND p.passenger_status = 'active') as booked_seats
FROM public.trips t
JOIN public.buses b ON t.bus_id = b.bus_id
WHERE t.trip_id = 15;
