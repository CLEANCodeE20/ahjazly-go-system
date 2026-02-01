-- Add auth_id column to drivers table for mobile app compatibility
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_drivers_auth_id ON public.drivers(auth_id);

-- Backfill auth_id from users table
UPDATE public.drivers d
SET auth_id = u.auth_id
FROM public.users u
WHERE d.user_id = u.user_id
AND d.auth_id IS NULL;
