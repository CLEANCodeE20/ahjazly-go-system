-- Update can_view_data to support new professional roles
-- Ensures SUPERUSER has global access and others have isolated access

BEGIN;

CREATE OR REPLACE FUNCTION public.can_view_data(_row_partner_id BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _user_id UUID := auth.uid();
    _role TEXT;
    _user_partner_id INTEGER;
BEGIN
    -- Case 1: Anonymous users (guests) -> Allow all (Public Browsing)
    IF _user_id IS NULL THEN
        RETURN TRUE;
    END IF;

    -- Case 2: Get user role and partner_id from user_roles
    SELECT role::text, partner_id INTO _role, _user_partner_id 
    FROM public.user_roles 
    WHERE user_id = _user_id 
    LIMIT 1;

    -- Case 3: Regular Customers (Authenticated but NO role record) -> Allow all
    IF _role IS NULL THEN
        RETURN TRUE;
    END IF;

    -- Case 4: Global Admins & SuperUsers -> Allow all
    IF _role IN ('admin', 'SUPERUSER') THEN
        RETURN TRUE;
    END IF;

    -- Case 5: Partners and Employees -> Strict Isolation
    -- They can only see data belonging to their company OR system-wide data (partner_id IS NULL)
    RETURN (_row_partner_id = _user_partner_id) OR (_row_partner_id IS NULL);
END;
$$;

COMMIT;
