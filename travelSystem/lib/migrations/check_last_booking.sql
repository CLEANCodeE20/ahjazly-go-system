-- =============================================
-- CHECK LAST BOOKING (Corrected)
-- فحص آخر حجز تم إنشاؤه
-- =============================================

SELECT 
    booking_id,
    booking_status,
    payment_status,
    expires_at,
    NOW() as current_server_time,
    (expires_at > NOW()) as is_active,
    booking_date -- Correct column name
FROM public.bookings
ORDER BY booking_id DESC
LIMIT 1;
