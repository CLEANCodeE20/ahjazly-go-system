-- ========================================================
-- UPDATE CHECK_PERMISSION FUNCTION
-- ========================================================

-- 1. Helper function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::TEXT FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1
$$;

-- 2. Core permission check function
CREATE OR REPLACE FUNCTION public.check_permission(p_permission_code TEXT)
RETURNS BOOLEAN
LANGUAGE PLPGSQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role TEXT;
    v_partner_id INTEGER;
BEGIN
    -- 1. Get current user info from user_roles
    -- We cast role to TEXT to match the new role_permissions table schema
    SELECT role::TEXT, partner_id INTO v_role, v_partner_id 
    FROM public.user_roles 
    WHERE user_id = auth.uid() 
    LIMIT 1;

    -- 2. Admins have all permissions
    IF v_role = 'admin' THEN
        RETURN TRUE;
    END IF;

    -- 3. Partners (Owners) have all permissions for their company
    -- (Optional: You might want partners to be restricted too, but usually they are superusers for their org)
    IF v_role = 'partner' THEN
        RETURN TRUE;
    END IF;

    -- 4. Check specific permissions for other roles (employees/managers)
    
    -- Check if partner has custom entries for this role
    IF EXISTS (SELECT 1 FROM public.role_permissions WHERE role = v_role AND partner_id = v_partner_id) THEN
        -- Use ONLY partner entries
        RETURN EXISTS (
            SELECT 1 
            FROM public.role_permissions 
            WHERE role = v_role 
              AND permission_code = p_permission_code
              AND partner_id = v_partner_id
        );
    ELSE
        -- Fall back to system defaults (partner_id IS NULL)
        RETURN EXISTS (
            SELECT 1 
            FROM public.role_permissions 
            WHERE role = v_role 
              AND permission_code = p_permission_code
              AND partner_id IS NULL
        );
    END IF;
END;
$$;
