-- Migration: Add Partner Settings and Logo Support
-- Description: Adds logo_url and settings column to partners table

ALTER TABLE public.partners 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{
    "notifications": {
        "emailBookings": true,
        "emailPayments": true,
        "emailReports": false,
        "smsBookings": true,
        "smsPayments": false,
        "pushNotifications": true
    },
    "appearance": {
        "language": "ar",
        "theme": "light",
        "calendar": "hijri"
    }
}'::JSONB;

-- Create storage bucket for logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('partner-assets', 'partner-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for partner-assets
-- 1. Allow public reading of logos
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'partner-assets');

-- 2. Allow partners to upload their own logo
CREATE POLICY "Partner Upload" ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'partner-assets' 
    AND (storage.foldername(name))[1] = 'partners'
    AND auth.uid() IN (
        SELECT auth_id FROM public.users WHERE partner_id = (SELECT (storage.foldername(name))[2]::bigint)
    )
);

-- 3. Allow partners to update/delete their own logo
CREATE POLICY "Partner Update" ON storage.objects FOR UPDATE
USING (
    bucket_id = 'partner-assets'
    AND (storage.foldername(name))[1] = 'partners'
    AND auth.uid() IN (
        SELECT auth_id FROM public.users WHERE partner_id = (SELECT (storage.foldername(name))[2]::bigint)
    )
);
