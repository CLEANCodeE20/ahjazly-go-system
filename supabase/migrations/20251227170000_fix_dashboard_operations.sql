-- FIX COMPANY DASHBOARD OPERATIONS (RLS & DATA SYNC)
-- This migration robustifies partner_id lookup and syncs existing data to prevent 403 errors.

BEGIN;

-- 1. Robustify get_current_partner_id
-- Checks both user_roles and users table to ensure reliability
CREATE OR REPLACE FUNCTION public.get_current_partner_id()
RETURNS INTEGER
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Try to get from user_roles first (source of truth for many existing policies)
  -- Then fallback to users table (source of truth for new profiles/employees)
  SELECT COALESCE(
    (SELECT partner_id FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1),
    (SELECT partner_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1)
  );
$$;

-- 2. Data Synchronization (Heal Inconsistencies)
-- Ensure partner_id is present in public.users if it's in public.user_roles
UPDATE public.users u
SET partner_id = ur.partner_id
FROM public.user_roles ur
WHERE u.auth_id = ur.user_id
  AND u.partner_id IS NULL 
  AND ur.partner_id IS NOT NULL;

-- Ensure partner_id is present in public.user_roles if it's in public.users
-- Only for partners and employees (admins shouldn't be tied to a partner in ur if not needed)
UPDATE public.user_roles ur
SET partner_id = u.partner_id
FROM public.users u
WHERE ur.user_id = u.auth_id
  AND ur.partner_id IS NULL
  AND u.partner_id IS NOT NULL
  AND ur.role IN ('partner', 'employee');

-- 3. Verify/Update RLS Policies for Buses
-- Ensure the policy uses the robust lookup
DROP POLICY IF EXISTS "Partners can manage their own buses" ON public.buses;
CREATE POLICY "Partners can manage their own buses" 
ON public.buses 
FOR ALL 
TO authenticated 
USING (partner_id = get_current_partner_id())
WITH CHECK (partner_id = get_current_partner_id());

-- 4. Verify/Update RLS Policies for Trips
DROP POLICY IF EXISTS "Partners can manage their own trips" ON public.trips;
CREATE POLICY "Partners can manage their own trips" 
ON public.trips 
FOR ALL 
TO authenticated 
USING (partner_id = get_current_partner_id())
WITH CHECK (partner_id = get_current_partner_id());

-- 5. Verify/Update RLS Policies for Branches
DROP POLICY IF EXISTS "Partners can manage their own branches" ON public.branches;
CREATE POLICY "Partners can manage their own branches" 
ON public.branches 
FOR ALL 
TO authenticated 
USING (partner_id = get_current_partner_id())
WITH CHECK (partner_id = get_current_partner_id());

-- 6. Verify/Update RLS Policies for Drivers
DROP POLICY IF EXISTS "Partners can manage their own drivers" ON public.drivers;
CREATE POLICY "Partners can manage their own drivers" 
ON public.drivers 
FOR ALL 
TO authenticated 
USING (partner_id = get_current_partner_id())
WITH CHECK (partner_id = get_current_partner_id());

-- 7. Fix route_stops RLS (Partners must be able to manage stops for their routes)
DROP POLICY IF EXISTS "Partners manage stops for own routes" ON public.route_stops;
CREATE POLICY "Partners manage stops for own routes" ON public.route_stops
FOR ALL TO authenticated
USING (route_id IN (SELECT route_id FROM public.routes WHERE partner_id = get_current_partner_id()))
WITH CHECK (route_id IN (SELECT route_id FROM public.routes WHERE partner_id = get_current_partner_id()));

-- 8. Improve handle_new_user trigger to preserve partner_id from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
    is_admin BOOLEAN;
    calculated_role TEXT;
    p_id INTEGER;
BEGIN
    -- Check for Admin domains
    is_admin := (new.email LIKE '%@admin.com') OR (new.email LIKE '%@ahjazly.com');
    calculated_role := CASE 
        WHEN is_admin THEN 'admin' 
        WHEN (new.raw_user_meta_data->>'user_type') = 'partner' THEN 'partner'
        ELSE COALESCE(new.raw_user_meta_data->>'user_type', 'employee') 
    END;

    p_id := (new.raw_user_meta_data->>'partner_id')::INTEGER;

    -- 1. Upsert Profile
    INSERT INTO public.users (
        auth_id, 
        full_name, 
        email, 
        user_type, 
        account_status,
        partner_id
    )
    VALUES (
        new.id, 
        COALESCE(new.raw_user_meta_data->>'full_name', 'New User'), 
        new.email, 
        calculated_role::user_type, 
        'active'::account_status,
        p_id
    )
    ON CONFLICT (auth_id) DO UPDATE 
    SET 
        email = excluded.email,
        user_type = excluded.user_type,
        account_status = excluded.account_status,
        partner_id = COALESCE(excluded.partner_id, public.users.partner_id);

    -- 2. Upsert Role
    INSERT INTO public.user_roles (user_id, role, partner_id)
    VALUES (
        new.id, 
        calculated_role::app_role, 
        p_id
    )
    ON CONFLICT (user_id) DO UPDATE 
    SET 
        role = excluded.role,
        partner_id = COALESCE(excluded.partner_id, public.user_roles.partner_id);

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
