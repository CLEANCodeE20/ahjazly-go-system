-- =============================================
-- CHECK TRIP CLASS SCRIPT
-- فحص فئة الباص للرحلة رقم 15
-- =============================================

SELECT 
    t.trip_id,
    t.departure_time,
    b.bus_id,
    bc.class_name, -- This is what we need to match 'VIP'
    t.status
FROM public.trips t
JOIN public.buses b ON t.bus_id = b.bus_id
JOIN public.bus_classes bc ON b.bus_class_id = bc.bus_class_id
WHERE t.trip_id = 15;
