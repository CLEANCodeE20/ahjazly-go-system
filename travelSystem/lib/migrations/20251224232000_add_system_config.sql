-- Add System Configuration Table
-- This migration creates a flexible configuration system for storing system-wide settings

-- 1. Create system_config table
CREATE TABLE IF NOT EXISTS public.system_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Add index for category-based queries
CREATE INDEX IF NOT EXISTS idx_system_config_category ON public.system_config(category);

-- 3. Insert default configurations

-- Admin email domains
INSERT INTO public.system_config (key, value, description, category, is_public) VALUES
('admin_domains', '["@admin.com", "@ahjazly.com"]'::jsonb, 'Email domains that automatically get admin role', 'authentication', false)
ON CONFLICT (key) DO NOTHING;

-- System settings
INSERT INTO public.system_config (key, value, description, category, is_public) VALUES
('app_name', '"احجزلي"'::jsonb, 'Application name', 'general', true),
('support_email', '"support@ahjazly.com"'::jsonb, 'Support email address', 'general', true),
('max_login_attempts', '5'::jsonb, 'Maximum login attempts before lockout', 'security', false),
('session_timeout_minutes', '60'::jsonb, 'Session timeout in minutes', 'security', false),
('enable_email_verification', 'true'::jsonb, 'Require email verification for new users', 'authentication', false)
ON CONFLICT (key) DO NOTHING;

-- 4. Create function to get config value
CREATE OR REPLACE FUNCTION public.get_config(config_key TEXT)
RETURNS JSONB
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT value FROM public.system_config WHERE key = config_key LIMIT 1;
$$;

-- 5. Create function to check if email is admin domain
CREATE OR REPLACE FUNCTION public.is_admin_email(email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    admin_domains JSONB;
    domain TEXT;
BEGIN
    -- Get admin domains from config
    admin_domains := public.get_config('admin_domains');
    
    -- Check if email ends with any admin domain
    FOR domain IN SELECT jsonb_array_elements_text(admin_domains)
    LOOP
        IF email LIKE '%' || domain THEN
            RETURN TRUE;
        END IF;
    END LOOP;
    
    RETURN FALSE;
END;
$$;

-- 6. Update handle_new_user trigger to use config
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
    is_admin BOOLEAN;
    calculated_role TEXT;
BEGIN
    -- Use the new is_admin_email function
    is_admin := public.is_admin_email(new.email);
    calculated_role := CASE WHEN is_admin THEN 'admin' ELSE 'customer' END;

    -- 1. Create Public Profile
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
        calculated_role::user_type, 
        'active'
    )
    ON CONFLICT (auth_id) DO UPDATE
    SET 
        email = new.email,
        user_type = calculated_role::user_type;

    -- 2. Assign Role in user_roles
    INSERT INTO public.user_roles (user_id, role, partner_id)
    VALUES (
        new.id, 
        calculated_role, 
        NULL
    )
    ON CONFLICT (user_id) DO UPDATE
    SET role = calculated_role;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Enable RLS on system_config
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies for system_config

-- Public configs can be read by anyone authenticated
DROP POLICY IF EXISTS "Public configs readable by authenticated" ON public.system_config;
CREATE POLICY "Public configs readable by authenticated" ON public.system_config
FOR SELECT TO authenticated
USING (is_public = true);

-- Admins can read all configs
DROP POLICY IF EXISTS "Admins can read all configs" ON public.system_config;
CREATE POLICY "Admins can read all configs" ON public.system_config
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can modify configs
DROP POLICY IF EXISTS "Admins can manage configs" ON public.system_config;
CREATE POLICY "Admins can manage configs" ON public.system_config
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 9. Create function to update config (with audit)
CREATE OR REPLACE FUNCTION public.update_config(
    config_key TEXT,
    new_value JSONB,
    updated_by UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only admins can update
    IF NOT public.has_role(updated_by, 'admin') THEN
        RAISE EXCEPTION 'Only admins can update system configuration';
    END IF;
    
    UPDATE public.system_config 
    SET value = new_value, updated_at = NOW()
    WHERE key = config_key;
    
    RETURN FOUND;
END;
$$;

-- 10. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_config(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_email(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_config(TEXT, JSONB, UUID) TO authenticated;

-- 11. Add helpful comments
COMMENT ON TABLE public.system_config IS 'System-wide configuration settings';
COMMENT ON FUNCTION public.get_config(TEXT) IS 'Get a configuration value by key';
COMMENT ON FUNCTION public.is_admin_email(TEXT) IS 'Check if an email belongs to an admin domain';
COMMENT ON FUNCTION public.update_config(TEXT, JSONB, UUID) IS 'Update a configuration value (admin only)';
