-- Migration: Add fcm_token column to users table
-- Description: Adds a column to store the primary FCM token for push notifications directly on the user record.

ALTER TABLE IF EXISTS public.users 
ADD COLUMN IF NOT EXISTS fcm_token TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.users.fcm_token IS 'The latest FCM device token for push notifications';

-- Index for performance (optional, but good for lookup)
CREATE INDEX IF NOT EXISTS idx_users_fcm_token ON public.users(fcm_token);
