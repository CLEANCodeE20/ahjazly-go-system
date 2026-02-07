-- Enhance Notifications Table
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS partner_id BIGINT REFERENCES public.partners(partner_id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS action_url TEXT,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Update RLS Policies for Notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;

-- 1. Admins full access
CREATE POLICY "Admins full access notifications" ON public.notifications
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Users/Partners read access
CREATE POLICY "Users view relevant notifications" ON public.notifications
    FOR SELECT TO authenticated
    USING (
        user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid())
        OR 
        partner_id IN (SELECT partner_id FROM public.users WHERE auth_id = auth.uid())
    );

-- 3. Users mark as read (UPDATE)
CREATE POLICY "Users update their own notifications" ON public.notifications
    FOR UPDATE TO authenticated
    USING (
        user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid())
        OR 
        partner_id IN (SELECT partner_id FROM public.users WHERE auth_id = auth.uid())
    )
    WITH CHECK (
        is_read IS NOT NULL -- Only allow updating is_read
    );

-- Trigger for new partner application notification to admins
CREATE OR REPLACE FUNCTION public.notify_admin_new_partner()
RETURNS TRIGGER AS $$
DECLARE
    admin_user_id BIGINT;
BEGIN
    -- Find an admin to notify (or just create a system-wide notification with user_id NULL if supported, 
    -- but our schema requires user_id. Let's find the first admin.)
    SELECT user_id INTO admin_user_id FROM public.users WHERE user_type = 'admin' LIMIT 1;
    
    IF admin_user_id IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, type, title, message, action_url, priority)
        VALUES (admin_user_id, 'system', 'طلب انضمام جديد', 'تقدمت شركة ' || NEW.company_name || ' بطلب انضمام للمنصة.', '/admin/partners', 'high');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS on_partner_created ON public.partners;
CREATE TRIGGER on_partner_created
    AFTER INSERT ON public.partners
    FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_partner();
