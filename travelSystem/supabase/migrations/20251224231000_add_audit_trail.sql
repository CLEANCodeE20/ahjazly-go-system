-- Add Audit Trail for Role Changes
-- This migration creates a comprehensive audit trail system for tracking role and permission changes

-- 1. Create role_changes_log table
CREATE TABLE IF NOT EXISTS public.role_changes_log (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    old_role TEXT,
    new_role TEXT,
    old_partner_id INTEGER,
    new_partner_id INTEGER,
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    changed_at TIMESTAMP DEFAULT NOW(),
    change_reason TEXT,
    ip_address INET,
    user_agent TEXT
);

-- 2. Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_role_changes_user_id ON public.role_changes_log(user_id);
CREATE INDEX IF NOT EXISTS idx_role_changes_changed_by ON public.role_changes_log(changed_by);
CREATE INDEX IF NOT EXISTS idx_role_changes_changed_at ON public.role_changes_log(changed_at DESC);

-- 3. Create trigger function to log role changes
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if role or partner_id actually changed
    IF (TG_OP = 'UPDATE' AND (OLD.role IS DISTINCT FROM NEW.role OR OLD.partner_id IS DISTINCT FROM NEW.partner_id)) THEN
        INSERT INTO public.role_changes_log (
            user_id,
            old_role,
            new_role,
            old_partner_id,
            new_partner_id,
            changed_by
        ) VALUES (
            NEW.user_id,
            OLD.role,
            NEW.role,
            OLD.partner_id,
            NEW.partner_id,
            auth.uid()
        );
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO public.role_changes_log (
            user_id,
            old_role,
            new_role,
            old_partner_id,
            new_partner_id,
            changed_by
        ) VALUES (
            NEW.user_id,
            NULL,
            NEW.role,
            NULL,
            NEW.partner_id,
            auth.uid()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Attach trigger to user_roles table
DROP TRIGGER IF EXISTS trigger_log_role_change ON public.user_roles;
CREATE TRIGGER trigger_log_role_change
    AFTER INSERT OR UPDATE ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.log_role_change();

-- 5. Enable RLS on role_changes_log
ALTER TABLE public.role_changes_log ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for role_changes_log

-- Admins can view all logs
DROP POLICY IF EXISTS "Admins can view all role changes" ON public.role_changes_log;
CREATE POLICY "Admins can view all role changes" ON public.role_changes_log
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Partners can view logs for their employees
DROP POLICY IF EXISTS "Partners can view own employee role changes" ON public.role_changes_log;
CREATE POLICY "Partners can view own employee role changes" ON public.role_changes_log
FOR SELECT TO authenticated
USING (
    user_id IN (
        SELECT user_id FROM public.user_roles 
        WHERE partner_id = (SELECT get_current_partner_id())
    )
    OR public.has_role(auth.uid(), 'admin')
);

-- Users can view their own role change history
DROP POLICY IF EXISTS "Users can view own role changes" ON public.role_changes_log;
CREATE POLICY "Users can view own role changes" ON public.role_changes_log
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- 7. Add helpful comment
COMMENT ON TABLE public.role_changes_log IS 
'Audit trail for all role and permission changes in the system';
