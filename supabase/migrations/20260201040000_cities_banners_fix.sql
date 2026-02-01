-- ==========================================================
-- CITIES & BANNERS SCHEMA & RLS FIX
-- Purpose: Align database with UI requirements and fix missing policies
-- ==========================================================

BEGIN;

-- 1. FIX CITIES TABLE SCHEMA
-- Add missing columns expected by CityManagement.tsx
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS code TEXT;

-- Rename city_id to id to match UI (Optional but recommended for consistency)
-- If we rename it, we must update all foreign keys. Let's just create a view or update UI. 
-- Better: Keep city_id but let UI handle it, OR rename if it's safe.
-- Given it's a new system, let's just make sure UI uses the right names.
-- Actually, let's keep city_id but add a column 'id' as a generated alias if needed, 
-- or just fix the UI. I will fix the UI.

-- 2. FIX RLS POLICIES FOR CITIES
DROP POLICY IF EXISTS "Anyone can view active cities" ON public.cities;
CREATE POLICY "Anyone can view active cities" 
ON public.cities FOR SELECT 
TO anon, authenticated 
USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage cities" ON public.cities;
CREATE POLICY "Admins can manage cities" 
ON public.cities FOR ALL 
TO authenticated 
USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERUSER'
    OR 
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role IN ('SUPERUSER', 'admin', 'PARTNER_ADMIN')
    )
);

-- 3. FIX BANNERS RLS POLICIES
DROP POLICY IF EXISTS "الكل يمكنه رؤية الإعلانات النشطة" ON public.banners;
DROP POLICY IF EXISTS "Anyone can view active banners" ON public.banners;
CREATE POLICY "Anyone can view active banners" 
ON public.banners FOR SELECT 
TO anon, authenticated
USING (is_active = true);

DROP POLICY IF EXISTS "Admins manage banners" ON public.banners;
CREATE POLICY "Admins manage banners" 
ON public.banners FOR ALL 
TO authenticated
USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERUSER'
    OR 
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role IN ('SUPERUSER', 'admin', 'PARTNER_ADMIN')
    )
);

-- 4. ENSURE BUCKET EXISTS (For banners)
-- Standard check for storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('app-assets', 'app-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for storage
DROP POLICY IF EXISTS "Public View App Assets" ON storage.objects;
CREATE POLICY "Public View App Assets" 
ON storage.objects FOR SELECT 
TO anon, authenticated 
USING (bucket_id = 'app-assets');

DROP POLICY IF EXISTS "Admins manage App Assets" ON storage.objects;
CREATE POLICY "Admins manage App Assets" 
ON storage.objects FOR ALL 
TO authenticated 
USING (
    bucket_id = 'app-assets' AND 
    ((auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERUSER')
);

COMMIT;
