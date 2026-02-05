-- =============================================
-- CHECK BUS LAYOUT
-- فحص قالب المقاعد للحافلة رقم 3
-- =============================================

SELECT 
    bus_id,
    model,
    seat_layout,
    (seat_layout IS NOT NULL AND seat_layout::text != '{}') as has_custom_layout
FROM public.buses 
WHERE bus_id = 3;
