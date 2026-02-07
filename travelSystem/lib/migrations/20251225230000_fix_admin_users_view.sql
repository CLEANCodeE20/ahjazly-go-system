-- MASTER ADMIN ACCESS REPAIR
-- This migration ensures admins have full access to ALL public tables.
-- It also fixes the join relationship between public.users and public.user_roles.

BEGIN;

-- 1. Fix user_roles <-> users profile link
-- This is critical for PostgREST joins like .select('*, user_roles(*)')
ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_profile_fk;

-- Ensure auth_id is UNIQUE first (required for FK target)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_auth_id_key;
ALTER TABLE public.users ADD CONSTRAINT users_auth_id_key UNIQUE (auth_id);

-- Add the FK
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_profile_fk 
FOREIGN KEY (user_id) REFERENCES public.users(auth_id) ON DELETE CASCADE;

-- 2. APPLY GLOBAL ADMIN POLICIES
-- We loop through all tables and grant 'admin' full access if they have the role.
DO $$ 
DECLARE
    t TEXT;
    table_list TEXT[] := ARRAY[
        'users', 'user_roles', 'partners', 'partner_applications', 'branches', 
        'employees', 'drivers', 'bus_classes', 'buses', 'seats', 'routes', 
        'route_stops', 'trips', 'cancel_policies', 'cancel_policy_rules', 
        'bookings', 'passengers', 'booking_cancellations', 'booking_approvals', 
        'booking_boarding_stop', 'booking_ledger', 'payment_transactions', 
        'refunds', 'refund_transactions', 'commissions', 'daily_commissions', 
        'partner_invoices', 'partner_invoice_items', 'partner_payments', 
        'documents', 'notifications', 'ratings', 'support_tickets', 'faqs', 
        'conversations', 'messages', 'user_device_tokens', 'ui_components',
        'ui_page_layouts', 'ui_component_placements', 'ui_advertisements',
        'ui_promotions', 'ui_site_settings'
    ];
BEGIN
    FOREACH t IN ARRAY table_list LOOP
        -- Drop any conflicting "Admins have full access" or similarly named policies
        EXECUTE format('DROP POLICY IF EXISTS "Admins have full access on %I" ON public.%I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "Admins full access on %I" ON public.%I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "Admins full access %s" ON public.%I', t, t);
        
        -- Create the Golden Policy for Admins
        EXECUTE format('
            CREATE POLICY "Admins full access on %I" 
            ON public.%I 
            FOR ALL 
            TO authenticated 
            USING (public.has_role(auth.uid(), ''admin''))
            WITH CHECK (public.has_role(auth.uid(), ''admin''))
        ', t, t);
    END LOOP;
END $$;

-- 3. Safety Check: Ensure 'Users view own profile' still works correctly
DROP POLICY IF EXISTS "Users view own profile" ON public.users;
CREATE POLICY "Users view own profile" 
ON public.users 
FOR SELECT 
TO authenticated 
USING (auth.uid() = auth_id OR public.has_role(auth.uid(), 'admin'));

COMMIT;
