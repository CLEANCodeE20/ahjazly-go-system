-- ========================================================
-- REFINED COMPREHENSIVE SECURITY HARDENING (RLS)
-- Platform: Ahjazly Bus Booking System
-- Date: 2024-12-24
-- ========================================================

-- 1. Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bus_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cancel_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cancel_policy_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_cancellations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_boarding_stop ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_device_tokens ENABLE ROW LEVEL SECURITY;

-- 2. Clean up existing policies to avoid conflicts
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- 3. GLOBAL ADMIN POLICY (Admin can do everything)
DO $$ 
DECLARE 
    t TEXT;
    tables TEXT[] := ARRAY[
        'users', 'user_roles', 'partners', 'partner_applications', 'branches', 
        'employees', 'drivers', 'bus_classes', 'buses', 'seats', 'routes', 
        'route_stops', 'trips', 'cancel_policies', 'cancel_policy_rules', 
        'bookings', 'passengers', 'booking_cancellations', 'booking_approvals', 
        'booking_boarding_stop', 'booking_ledger', 'payment_transactions', 
        'refunds', 'refund_transactions', 'commissions', 'daily_commissions', 
        'partner_invoices', 'partner_invoice_items', 'partner_payments', 
        'documents', 'notifications', 'ratings', 'support_tickets', 'faqs', 
        'conversations', 'messages', 'user_device_tokens'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        EXECUTE format('CREATE POLICY "Admins have full access on %I" ON public.%I FOR ALL TO authenticated USING (has_role(auth.uid(), ''admin'')) WITH CHECK (has_role(auth.uid(), ''admin''))', t, t);
    END LOOP;
END $$;

-- 4. PUBLIC ACCESS POLICIES (Browsing)
CREATE POLICY "Public read access for bus_classes" ON public.bus_classes FOR SELECT USING (true);
CREATE POLICY "Public read access for buses" ON public.buses FOR SELECT USING (true);
CREATE POLICY "Public read access for seats" ON public.seats FOR SELECT USING (true);
CREATE POLICY "Public read access for routes" ON public.routes FOR SELECT USING (true);
CREATE POLICY "Public read access for route_stops" ON public.route_stops FOR SELECT USING (true);
CREATE POLICY "Public read access for trips" ON public.trips FOR SELECT USING (true);
CREATE POLICY "Public read access for faqs" ON public.faqs FOR SELECT USING (is_active = true);
CREATE POLICY "Public read access for ratings" ON public.ratings FOR SELECT USING (true);
CREATE POLICY "Public read access for cancel_policies" ON public.cancel_policies FOR SELECT USING (is_active = true);
CREATE POLICY "Public read access for cancel_policy_rules" ON public.cancel_policy_rules FOR SELECT USING (is_active = true);

-- 5. PARTNER & EMPLOYEE ISOLATION (Tables WITH partner_id)
DO $$ 
DECLARE 
    t TEXT;
    partner_id_tables TEXT[] := ARRAY[
        'partners', 'branches', 'employees', 'drivers', 'buses', 'routes', 
        'trips', 'cancel_policies', 'commissions', 'booking_ledger', 
        'partner_invoices', 'partner_payments'
    ];
BEGIN
    FOREACH t IN ARRAY partner_id_tables LOOP
        IF t = 'partners' THEN
            EXECUTE format('CREATE POLICY "Partners/Employees view own company" ON public.%I FOR SELECT TO authenticated USING (partner_id = get_current_partner_id())', t);
            EXECUTE format('CREATE POLICY "Partners update own company" ON public.%I FOR UPDATE TO authenticated USING (partner_id = get_current_partner_id()) WITH CHECK (partner_id = get_current_partner_id())', t);
        ELSE
            EXECUTE format('CREATE POLICY "Partners/Employees manage own %I" ON public.%I FOR ALL TO authenticated USING (partner_id = get_current_partner_id()) WITH CHECK (partner_id = get_current_partner_id())', t, t);
        END IF;
    END LOOP;
END $$;

-- 6. PARTNER & EMPLOYEE ISOLATION (Tables WITHOUT partner_id - using joins)

-- Bookings (Join with trips)
CREATE POLICY "Partners/Employees manage own bookings" ON public.bookings 
FOR ALL TO authenticated 
USING (trip_id IN (SELECT trip_id FROM public.trips WHERE partner_id = get_current_partner_id()))
WITH CHECK (trip_id IN (SELECT trip_id FROM public.trips WHERE partner_id = get_current_partner_id()));

-- Passengers (Join with trips or bookings)
CREATE POLICY "Partners/Employees view own passengers" ON public.passengers 
FOR SELECT TO authenticated 
USING (trip_id IN (SELECT trip_id FROM public.trips WHERE partner_id = get_current_partner_id()));

-- Booking Cancellations (Join with bookings)
CREATE POLICY "Partners/Employees view own cancellations" ON public.booking_cancellations 
FOR SELECT TO authenticated 
USING (booking_id IN (SELECT booking_id FROM public.bookings b JOIN public.trips t ON b.trip_id = t.trip_id WHERE t.partner_id = get_current_partner_id()));

-- Payment Transactions (Join with bookings)
CREATE POLICY "Partners/Employees view own payments" ON public.payment_transactions 
FOR SELECT TO authenticated 
USING (booking_id IN (SELECT booking_id FROM public.bookings b JOIN public.trips t ON b.trip_id = t.trip_id WHERE t.partner_id = get_current_partner_id()));

-- Refunds (Join with bookings)
CREATE POLICY "Partners/Employees view own refunds" ON public.refunds 
FOR SELECT TO authenticated 
USING (booking_id IN (SELECT booking_id FROM public.bookings b JOIN public.trips t ON b.trip_id = t.trip_id WHERE t.partner_id = get_current_partner_id()));

-- 7. CUSTOMER ISOLATION (User Bound)
CREATE POLICY "Users can manage own profile" ON public.users 
FOR ALL TO authenticated USING (auth_id = auth.uid()) WITH CHECK (auth_id = auth.uid());

CREATE POLICY "Users can manage own bookings" ON public.bookings 
FOR ALL TO authenticated USING (user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid())) 
WITH CHECK (user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can view passengers for own bookings" ON public.passengers 
FOR SELECT TO authenticated USING (booking_id IN (SELECT booking_id FROM public.bookings WHERE user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid())));

CREATE POLICY "Users can manage own notifications" ON public.notifications 
FOR ALL TO authenticated USING (user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid())) 
WITH CHECK (user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can manage own tickets" ON public.support_tickets 
FOR ALL TO authenticated USING (user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid())) 
WITH CHECK (user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can manage own ratings" ON public.ratings 
FOR ALL TO authenticated USING (user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid())) 
WITH CHECK (user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can manage own device tokens" ON public.user_device_tokens 
FOR ALL TO authenticated USING (user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid())) 
WITH CHECK (user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid()));

-- 8. CHAT SECURITY (Participants only)
CREATE POLICY "Users can view own conversations" ON public.conversations 
FOR SELECT TO authenticated USING (user_id = auth.uid()::text OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view project-related messages" ON public.messages 
FOR SELECT TO authenticated USING (
    conversation_id IN (SELECT id FROM public.conversations WHERE user_id = auth.uid()::text) 
    OR has_role(auth.uid(), 'admin')
);

-- 9. PARTNER APPLICATIONS (Special Flow)
CREATE POLICY "Anyone can submit application" ON public.partner_applications FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Users view own application" ON public.partner_applications FOR SELECT TO authenticated USING (auth_user_id = auth.uid());

-- FINAL SUMMARY: RLS is now correctly enforced handling tables without direct partner_id.
