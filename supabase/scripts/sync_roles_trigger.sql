-- SYNC USER ROLES TO METADATA
-- Ensures that when AdminDashboard updates the role in public.user_roles,
-- the change is reflected in auth.users.raw_app_meta_data (so the JWT is correct).

CREATE OR REPLACE FUNCTION public.sync_user_role_to_metadata()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE auth.users
    SET raw_app_meta_data = 
        COALESCE(raw_app_meta_data, '{}'::jsonb) || 
        jsonb_build_object(
            'role', NEW.role,
            'partner_id', NEW.partner_id
        )
    WHERE id = NEW.auth_id;
    
    RETURN NEW;
END;
$$;

-- Drop trigger if exists to avoid conflicts
DROP TRIGGER IF EXISTS on_role_change ON public.user_roles;

-- Create the trigger
CREATE TRIGGER on_role_change
AFTER INSERT OR UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_role_to_metadata();
