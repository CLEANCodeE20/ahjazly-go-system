-- Add 'rejected' value to booking_status enum
-- This fixes the 22P02 error in search_trips and notification triggers

-- NOTE: ALTER TYPE ... ADD VALUE cannot be executed inside a transaction block or DO block.
-- Supabase migrations normally run each file as a transaction, but ADD VALUE is a special case.
-- If this fails in a transaction, it might need to be run manually or in a non-transactional migration.
-- However, for simple migration files, Supabase handles it if it's the only command or handled by their runner.

ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'rejected';
ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'paid';
