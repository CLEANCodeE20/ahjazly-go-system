-- Fix RLS Policies for Maintenance Mode System
-- This migration ensures proper access control for ui_site_settings table
-- to support the comprehensive maintenance mode feature

-- ============================================================================
-- Step 1: Drop existing policies
-- ============================================================================

DROP POLICY IF EXISTS "Admins full access settings" ON public.ui_site_settings;
DROP POLICY IF EXISTS "Public read public settings" ON public.ui_site_settings;
DROP POLICY IF EXISTS "Admins have full access on ui_site_settings" ON public.ui_site_settings;

-- ============================================================================
-- Step 2: Create new RLS policies with proper SUPERUSER check
-- ============================================================================

-- Allow everyone (anon + authenticated) to read ALL settings
-- This is critical for MaintenanceGuard to work for all visitors
DROP POLICY IF EXISTS "Everyone can read all settings" ON public.ui_site_settings;
CREATE POLICY "Everyone can read all settings" ON public.ui_site_settings
    FOR SELECT 
    TO anon, authenticated
    USING (true);

-- Only SUPERUSER can modify settings (INSERT, UPDATE, DELETE)
-- Using JWT claims to check for SUPERUSER role
DROP POLICY IF EXISTS "Only SUPERUSER can modify settings" ON public.ui_site_settings;
CREATE POLICY "Only SUPERUSER can modify settings" ON public.ui_site_settings
    FOR ALL 
    TO authenticated
    USING (
        (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'SUPERUSER'
    )
    WITH CHECK (
        (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'SUPERUSER'
    );

-- ============================================================================
-- Step 3: Ensure critical settings exist
-- ============================================================================

-- Insert or update critical settings for maintenance mode
INSERT INTO public.ui_site_settings (setting_key, setting_value, setting_type, setting_group, description, is_public)
VALUES
    ('maintenance_mode', 'false', 'boolean', 'system', 'وضع الصيانة - يمنع الوصول لجميع المستخدمين عدا المديرين', true),
    ('site_name', 'منصه احجزلي ', 'text', 'general', 'اسم الموقع', true),
    ('contact_email', 'ahjazliya@gmail.com', 'text', 'general', 'البريد الإلكتروني للتواصل', true),
    ('maintenance_message', 'نعتذر، الموقع تحت الصيانة حالياً. سنعود قريباً.', 'text', 'system', 'رسالة وضع الصيانة', true),
    ('maintenance_estimated_time', '', 'text', 'system', 'الوقت المتوقع لانتهاء الصيانة', true),
    ('maintenance_scheduled_start', '', 'date', 'system', 'وقت بدء الصيانة المجدول', true),
    ('maintenance_scheduled_end', '', 'date', 'system', 'وقت انتهاء الصيانة المجدول', true),
    ('maintenance_warning_threshold', '30', 'number', 'system', 'وقت التنبيه قبل الصيانة (بالدقائق)', true)
ON CONFLICT (setting_key) 
DO UPDATE SET
    description = EXCLUDED.description,
    is_public = EXCLUDED.is_public,
    updated_at = NOW();

-- ============================================================================
-- Verification Query (for testing)
-- ============================================================================

-- To verify the policies are working, run:
-- SELECT * FROM public.ui_site_settings WHERE setting_key = 'maintenance_mode';
