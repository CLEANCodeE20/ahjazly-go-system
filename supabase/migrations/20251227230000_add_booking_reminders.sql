-- Add reminded_at column to track pre-departure notifications
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS reminded_at TIMESTAMP;

COMMENT ON COLUMN public.bookings.reminded_at IS 'Timestamp when the pre-departure reminder was sent';
