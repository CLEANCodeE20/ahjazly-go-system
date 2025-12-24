-- Auto-Admin Trigger Logic
-- Instead of hacking passwords, we allow the UI signup to work naturally,
-- but we intercept the creation to Upgrade the user to Admin based on email.

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
    is_admin BOOLEAN;
BEGIN
    -- Check if email indicates an admin user (You can use any specific domain or keyword)
    is_admin := (new.email LIKE '%@admin.com') OR (new.email LIKE '%@ahjazly.com');

    INSERT INTO public.users (
        auth_id, 
        full_name, 
        email, 
        user_type, 
        account_status
    )
    VALUES (
        new.id, 
        COALESCE(new.raw_user_meta_data->>'full_name', 'New User'), 
        new.email, 
        CASE WHEN is_admin THEN 'admin'::user_type ELSE 'customer'::user_type END, 
        'active'
    )
    ON CONFLICT (auth_id) DO UPDATE
    SET 
        email = new.email,
        user_type = CASE WHEN is_admin THEN 'admin'::user_type ELSE public.users.user_type END;

    -- Assign Role in user_roles
    INSERT INTO public.user_roles (user_id, role, partner_id)
    VALUES (
        new.id, 
        CASE WHEN is_admin THEN 'admin' ELSE 'customer' END, 
        NULL
    )
    ON CONFLICT (user_id) DO UPDATE
    SET role = CASE WHEN is_admin THEN 'admin' ELSE public.user_roles.role END;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger is active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
