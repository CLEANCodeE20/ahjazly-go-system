-- ==========================================================
-- UPDATE BOOKING DETAILS VIEW FOR DISRUPTIONS
-- Date: 2026-02-07
-- Purpose: Expose trip status, delay, and diversion data to the mobile app
-- ==========================================================

BEGIN;

DROP VIEW IF EXISTS public.booking_details_view CASCADE;

CREATE OR REPLACE VIEW public.booking_details_view AS
SELECT
    b.booking_id,
    b.auth_id,
    u.full_name,
    b.booking_status,
    b.payment_status,
    b.total_price,
    b.refund_amount,
    b.cancellation_fee,
    b.booking_date,
    b.expires_at, -- Ensure expires_at is included
    t.trip_id,
    t.departure_time,
    t.arrival_time,
    t.status as trip_status, -- NEW: Trip Status
    t.delay_minutes,      -- NEW: Delay Minutes
    t.is_diverted,       -- NEW: Diversion Flag
    bc.class_name as bus_class,
    r.origin_city,
    r.destination_city,
    p.partner_id,
    p.company_name,
    d.driver_id,
    -- Passenger info
    (
        SELECT jsonb_agg(jsonb_build_object(
            'full_name', pa.full_name,
            'phone_number', pa.phone_number,
            'id_number', pa.id_number,
            'seat_id', pa.seat_id,
            'gender', pa.gender,
            'birth_date', pa.birth_date,
            'id_image', pa.id_image,
            'passenger_status', pa.passenger_status
        ))
        FROM public.passengers pa 
        WHERE pa.booking_id = b.booking_id
    ) as passengers,
    -- Rating info
    EXISTS(SELECT 1 FROM public.ratings ra WHERE ra.booking_id = b.booking_id) as has_rating
FROM
    public.bookings b
LEFT JOIN
    public.users u ON b.auth_id = u.auth_id
JOIN
    public.trips t ON b.trip_id = t.trip_id
LEFT JOIN
    public.buses bu ON t.bus_id = bu.bus_id
LEFT JOIN
    public.bus_classes bc ON bu.bus_class_id = bc.bus_class_id
JOIN
    public.routes r ON t.route_id = r.route_id
JOIN
    public.partners p ON t.partner_id = p.partner_id
LEFT JOIN
    public.drivers d ON t.driver_id = d.driver_id;

COMMIT;
