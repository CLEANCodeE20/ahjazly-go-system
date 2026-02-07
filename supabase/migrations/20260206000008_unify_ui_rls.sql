-- Migration: 20260206000008_unify_ui_rls.sql
-- Description: Fix RLS for SDUI and Banners to support SUPERUSER and avoid data filtering for admins

BEGIN;

-- 1. Helper Function to check Admin/Superuser access (Consolidated)
CREATE OR REPLACE FUNCTION public.is_admin_or_superuser(u_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        (auth.jwt() -> 'app_metadata' ->> 'role') IN ('SUPERUSER', 'admin')
        OR EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = u_id 
            AND role::text IN ('SUPERUSER', 'admin')
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update BANNERS Policies
DROP POLICY IF EXISTS "Public can view active banners" ON public.banners;
DROP POLICY IF EXISTS "Superusers can manage banners" ON public.banners;

-- Read: Public sees active only, Admin sees ALL
CREATE POLICY "Select banners policy" 
ON public.banners FOR SELECT 
TO anon, authenticated
USING (
    is_active = true 
    OR public.is_admin_or_superuser(auth.uid())
);

-- Write: Admins/Superusers only
CREATE POLICY "Manage banners policy"
ON public.banners FOR ALL
TO authenticated
USING (public.is_admin_or_superuser(auth.uid()))
WITH CHECK (public.is_admin_or_superuser(auth.uid()));


-- 3. Update SDUI COMPONENTS Policies
DROP POLICY IF EXISTS "Admins full access components" ON public.ui_components;
DROP POLICY IF EXISTS "Public read published components" ON public.ui_components;

CREATE POLICY "Manage UI components" 
ON public.ui_components FOR ALL 
TO authenticated
USING (public.is_admin_or_superuser(auth.uid()))
WITH CHECK (public.is_admin_or_superuser(auth.uid()));

CREATE POLICY "View UI components" 
ON public.ui_components FOR SELECT 
TO anon, authenticated
USING (
    status = 'published' 
    OR public.is_admin_or_superuser(auth.uid())
);


-- 4. Update SDUI PAGE LAYOUTS Policies
DROP POLICY IF EXISTS "Admins full access layouts" ON public.ui_page_layouts;
DROP POLICY IF EXISTS "Public read active layouts" ON public.ui_page_layouts;

CREATE POLICY "Manage UI layouts" 
ON public.ui_page_layouts FOR ALL 
TO authenticated
USING (public.is_admin_or_superuser(auth.uid()))
WITH CHECK (public.is_admin_or_superuser(auth.uid()));

CREATE POLICY "View UI layouts" 
ON public.ui_page_layouts FOR SELECT 
TO anon, authenticated
USING (
    is_active = true 
    OR public.is_admin_or_superuser(auth.uid())
);


-- 5. Update SDUI COMPONENT PLACEMENTS Policies
DROP POLICY IF EXISTS "Admins full access placements" ON public.ui_component_placements;
DROP POLICY IF EXISTS "Public read visible placements" ON public.ui_component_placements;

CREATE POLICY "Manage UI placements" 
ON public.ui_component_placements FOR ALL 
TO authenticated
USING (public.is_admin_or_superuser(auth.uid()))
WITH CHECK (public.is_admin_or_superuser(auth.uid()));

CREATE POLICY "View UI placements" 
ON public.ui_component_placements FOR SELECT 
TO anon, authenticated
USING (
    is_visible = true 
    OR public.is_admin_or_superuser(auth.uid())
);


-- 6. Update SDUI ADVERTISEMENTS Policies
DROP POLICY IF EXISTS "Admins full access ads" ON public.ui_advertisements;
DROP POLICY IF EXISTS "Public read active ads" ON public.ui_advertisements;

CREATE POLICY "Manage UI ads" 
ON public.ui_advertisements FOR ALL 
TO authenticated
USING (public.is_admin_or_superuser(auth.uid()))
WITH CHECK (public.is_admin_or_superuser(auth.uid()));

CREATE POLICY "View UI ads" 
ON public.ui_advertisements FOR SELECT 
TO anon, authenticated
USING (
    is_active = true 
    OR public.is_admin_or_superuser(auth.uid())
);


-- 7. Update SDUI PROMOTIONS Policies
DROP POLICY IF EXISTS "Admins full access promotions" ON public.ui_promotions;
DROP POLICY IF EXISTS "Public read active promotions" ON public.ui_promotions;

CREATE POLICY "Manage UI promotions" 
ON public.ui_promotions FOR ALL 
TO authenticated
USING (public.is_admin_or_superuser(auth.uid()))
WITH CHECK (public.is_admin_or_superuser(auth.uid()));

CREATE POLICY "View UI promotions" 
ON public.ui_promotions FOR SELECT 
TO anon, authenticated
USING (
    is_active = true 
    OR public.is_admin_or_superuser(auth.uid())
);


-- 8. Update UI SITE SETTINGS Policies
DROP POLICY IF EXISTS "Admins full access settings" ON public.ui_site_settings;
DROP POLICY IF EXISTS "Public read public settings" ON public.ui_site_settings;

CREATE POLICY "Manage UI settings" 
ON public.ui_site_settings FOR ALL 
TO authenticated
USING (public.is_admin_or_superuser(auth.uid()))
WITH CHECK (public.is_admin_or_superuser(auth.uid()));

CREATE POLICY "View UI settings" 
ON public.ui_site_settings FOR SELECT 
TO anon, authenticated
USING (
    is_public = true 
    OR public.is_admin_or_superuser(auth.uid())
);

COMMIT;
