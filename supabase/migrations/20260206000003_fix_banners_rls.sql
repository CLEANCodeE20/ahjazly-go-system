-- =============================================
-- FIX BANNERS RLS & STORAGE
-- إصلاح صلاحيات البنرات والتخزين
-- =============================================

-- 1. Ensure Table Exists (Idempotent)
CREATE TABLE IF NOT EXISTS public.banners (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255),
    image_url TEXT NOT NULL,
    target_url TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Clean up old policies (Idempotent)
DROP POLICY IF EXISTS "الكل يمكنه رؤية الإعلانات النشطة" ON public.banners;
DROP POLICY IF EXISTS "المسؤولين لديهم صلاحيات كاملة على الإعلانات" ON public.banners;
DROP POLICY IF EXISTS "Public can view active banners" ON public.banners;
DROP POLICY IF EXISTS "Superusers can manage banners" ON public.banners;

-- 3. Create New Policies for Banners Table

-- Read Policy: Everyone can see ACTIVE banners
CREATE POLICY "Public can view active banners" 
ON public.banners FOR SELECT 
TO anon, authenticated
USING (is_active = true);

-- Write Policy: Only SUPERUSER can insert/update/delete
CREATE POLICY "Superusers can manage banners"
ON public.banners FOR ALL
TO authenticated
USING (
    (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'SUPERUSER'
)
WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'SUPERUSER'
);

-- 4. Fix Storage Policies for 'app-assets'

-- Ensure bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('app-assets', 'app-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop old storage policies
DROP POLICY IF EXISTS "Public Access for App Assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage app assets" ON storage.objects;

-- Create New Storage Policies

-- Public Read
CREATE POLICY "Public Access for App Assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'app-assets');

-- SUPERUSER Full Access (Upload/Delete/Update)
CREATE POLICY "Superusers can manage app assets"
ON storage.objects FOR ALL
TO authenticated
USING (
    bucket_id = 'app-assets' AND
    (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'SUPERUSER'
)
WITH CHECK (
    bucket_id = 'app-assets' AND
    (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'SUPERUSER'
);
