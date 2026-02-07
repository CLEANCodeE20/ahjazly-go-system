-- Fix SDUI RLS Violation and Consolidate has_role function (Final Safe Version)

-- 1. Update the TEXT version of has_role
-- Parameter names must match exactly: (user_id, role_name)
CREATE OR REPLACE FUNCTION public.has_role(user_id UUID, role_name TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_roles.user_id = $1 
    AND user_roles.role::text = $2
  );
$$;

-- 2. Update the app_role version of has_role
-- Parameter names must match exactly: (_user_id, _role)
-- We make it a wrapper for the TEXT version to ensure consistency
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role($1, $2::text);
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.has_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO anon;

-- 3. Restore RLS Policies for SDUI Tables
-- We ensure these exist and are correct for Admins and Public

-- UI Components
DROP POLICY IF EXISTS "Admins full access components" ON public.ui_components;
DROP POLICY IF EXISTS "Public read published components" ON public.ui_components;
DROP POLICY IF EXISTS "Admins have full access on ui_components" ON public.ui_components;

CREATE POLICY "Admins full access components" ON public.ui_components
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public read published components" ON public.ui_components
    FOR SELECT TO anon, authenticated
    USING (status = 'published');

-- UI Page Layouts
DROP POLICY IF EXISTS "Admins full access layouts" ON public.ui_page_layouts;
DROP POLICY IF EXISTS "Public read active layouts" ON public.ui_page_layouts;
DROP POLICY IF EXISTS "Admins have full access on ui_page_layouts" ON public.ui_page_layouts;

CREATE POLICY "Admins full access layouts" ON public.ui_page_layouts
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public read active layouts" ON public.ui_page_layouts
    FOR SELECT TO anon, authenticated
    USING (is_active = true);

-- UI Component Placements
DROP POLICY IF EXISTS "Admins full access placements" ON public.ui_component_placements;
DROP POLICY IF EXISTS "Public read visible placements" ON public.ui_component_placements;
DROP POLICY IF EXISTS "Admins have full access on ui_component_placements" ON public.ui_component_placements;

CREATE POLICY "Admins full access placements" ON public.ui_component_placements
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public read visible placements" ON public.ui_component_placements
    FOR SELECT TO anon, authenticated
    USING (is_visible = true);

-- UI Advertisements
DROP POLICY IF EXISTS "Admins full access ads" ON public.ui_advertisements;
DROP POLICY IF EXISTS "Public read active ads" ON public.ui_advertisements;
DROP POLICY IF EXISTS "Admins have full access on ui_advertisements" ON public.ui_advertisements;

CREATE POLICY "Admins full access ads" ON public.ui_advertisements
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public read active ads" ON public.ui_advertisements
    FOR SELECT TO anon, authenticated
    USING (is_active = true AND (start_date IS NULL OR start_date <= NOW()) AND (end_date IS NULL OR end_date >= NOW()));

-- UI Promotions
DROP POLICY IF EXISTS "Admins full access promotions" ON public.ui_promotions;
DROP POLICY IF EXISTS "Public read active promotions" ON public.ui_promotions;
DROP POLICY IF EXISTS "Admins have full access on ui_promotions" ON public.ui_promotions;

CREATE POLICY "Admins full access promotions" ON public.ui_promotions
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public read active promotions" ON public.ui_promotions
    FOR SELECT TO anon, authenticated
    USING (is_active = true);

-- UI Site Settings
DROP POLICY IF EXISTS "Admins full access settings" ON public.ui_site_settings;
DROP POLICY IF EXISTS "Public read public settings" ON public.ui_site_settings;
DROP POLICY IF EXISTS "Admins have full access on ui_site_settings" ON public.ui_site_settings;

CREATE POLICY "Admins full access settings" ON public.ui_site_settings
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public read public settings" ON public.ui_site_settings
    FOR SELECT TO anon, authenticated
    USING (is_public = true);
