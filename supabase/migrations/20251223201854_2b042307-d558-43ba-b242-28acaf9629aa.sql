
-- =============================================
-- ENUMS (أنواع مخصصة)
-- =============================================

-- حالة الحساب
CREATE TYPE public.account_status AS ENUM ('active', 'inactive', 'suspended', 'pending');

-- نوع المستخدم
CREATE TYPE public.user_type AS ENUM ('customer', 'partner', 'admin', 'driver', 'employee');

-- الجنس
CREATE TYPE public.gender_type AS ENUM ('male', 'female');

-- حالة الحافلة
CREATE TYPE public.bus_status AS ENUM ('active', 'maintenance', 'inactive', 'retired');

-- نوع الحافلة
CREATE TYPE public.bus_type AS ENUM ('standard', 'vip', 'sleeper', 'double_decker');

-- حالة الرحلة
CREATE TYPE public.trip_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled', 'delayed');

-- حالة الحجز
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'expired');

-- طريقة الدفع
CREATE TYPE public.payment_method AS ENUM ('cash', 'card', 'wallet', 'bank_transfer', 'stc_pay');

-- حالة الدفع
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded', 'partially_refunded');

-- حالة الشريك
CREATE TYPE public.partner_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');

-- نوع الإشعار
CREATE TYPE public.notification_type AS ENUM ('booking', 'payment', 'trip', 'system', 'promotion');

-- نوع المستند
CREATE TYPE public.document_type AS ENUM ('id_card', 'license', 'registration', 'insurance', 'other');

-- حالة التحقق من المستند
CREATE TYPE public.verification_status AS ENUM ('pending', 'approved', 'rejected');

-- نوع القيد المحاسبي
CREATE TYPE public.ledger_entry_type AS ENUM ('booking', 'refund', 'commission', 'adjustment');

-- =============================================
-- TABLES (الجداول)
-- =============================================

-- جدول الشركاء
CREATE TABLE public.partners (
    partner_id BIGSERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    address TEXT,
    application_documents_url TEXT,
    commission_percentage NUMERIC(5,2) DEFAULT 10.00,
    status partner_status DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- جدول المستخدمين
CREATE TABLE public.users (
    user_id BIGSERIAL PRIMARY KEY,
    auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone_number VARCHAR(20),
    password_hash VARCHAR(255),
    user_type user_type DEFAULT 'customer',
    account_status account_status DEFAULT 'active',
    gender gender_type,
    partner_id BIGINT REFERENCES public.partners(partner_id),
    verification_code INTEGER,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- جدول الفروع
CREATE TABLE public.branches (
    branch_id BIGSERIAL PRIMARY KEY,
    partner_id BIGINT REFERENCES public.partners(partner_id) ON DELETE CASCADE,
    branch_name VARCHAR(255) NOT NULL,
    city VARCHAR(100),
    address TEXT,
    phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

-- جدول فئات الحافلات
CREATE TABLE public.bus_classes (
    bus_class_id BIGSERIAL PRIMARY KEY,
    class_name VARCHAR(100) NOT NULL,
    description TEXT,
    price_adjustment_factor NUMERIC(5,2) DEFAULT 1.00
);

-- جدول الحافلات
CREATE TABLE public.buses (
    bus_id BIGSERIAL PRIMARY KEY,
    partner_id BIGINT REFERENCES public.partners(partner_id) ON DELETE CASCADE,
    license_plate VARCHAR(50) UNIQUE NOT NULL,
    model VARCHAR(100),
    bus_type bus_type DEFAULT 'standard',
    bus_class_id BIGINT REFERENCES public.bus_classes(bus_class_id),
    capacity INTEGER DEFAULT 40,
    status bus_status DEFAULT 'active',
    owner_user_id BIGINT REFERENCES public.users(user_id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- جدول المقاعد
CREATE TABLE public.seats (
    seat_id BIGSERIAL PRIMARY KEY,
    bus_id BIGINT REFERENCES public.buses(bus_id) ON DELETE CASCADE,
    seat_number VARCHAR(10) NOT NULL,
    price_adjustment_factor NUMERIC(5,2) DEFAULT 1.00,
    is_available BOOLEAN DEFAULT true
);

-- جدول السائقين
CREATE TABLE public.drivers (
    driver_id BIGSERIAL PRIMARY KEY,
    partner_id BIGINT REFERENCES public.partners(partner_id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    license_number VARCHAR(50),
    license_expiry DATE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

-- جدول الموظفين
CREATE TABLE public.employees (
    employee_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(user_id) ON DELETE CASCADE,
    partner_id BIGINT REFERENCES public.partners(partner_id) ON DELETE CASCADE,
    branch_id BIGINT REFERENCES public.branches(branch_id),
    role_in_company VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

-- جدول المسارات
CREATE TABLE public.routes (
    route_id BIGSERIAL PRIMARY KEY,
    partner_id BIGINT REFERENCES public.partners(partner_id) ON DELETE CASCADE,
    origin_city VARCHAR(100) NOT NULL,
    destination_city VARCHAR(100) NOT NULL,
    distance_km NUMERIC(10,2),
    estimated_duration_hours NUMERIC(5,2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- جدول محطات المسار
CREATE TABLE public.route_stops (
    stop_id BIGSERIAL PRIMARY KEY,
    route_id BIGINT REFERENCES public.routes(route_id) ON DELETE CASCADE,
    stop_name VARCHAR(255) NOT NULL,
    stop_location VARCHAR(255),
    stop_order INTEGER,
    preparation_time TIME,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- جدول الرحلات
CREATE TABLE public.trips (
    trip_id BIGSERIAL PRIMARY KEY,
    partner_id BIGINT REFERENCES public.partners(partner_id) ON DELETE CASCADE,
    route_id BIGINT REFERENCES public.routes(route_id) ON DELETE CASCADE,
    bus_id BIGINT REFERENCES public.buses(bus_id),
    driver_id BIGINT REFERENCES public.drivers(driver_id),
    departure_time TIMESTAMP NOT NULL,
    arrival_time TIMESTAMP,
    base_price NUMERIC(10,2) NOT NULL,
    status trip_status DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- جدول سياسات الإلغاء
CREATE TABLE public.cancel_policies (
    cancel_policy_id BIGSERIAL PRIMARY KEY,
    partner_id BIGINT REFERENCES public.partners(partner_id) ON DELETE CASCADE,
    policy_name VARCHAR(255) NOT NULL,
    description TEXT,
    refund_percentage NUMERIC(5,2) DEFAULT 100.00,
    days_before_trip INTEGER DEFAULT 0,
    priority INTEGER DEFAULT 0,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- جدول قواعد سياسات الإلغاء
CREATE TABLE public.cancel_policy_rules (
    rule_id BIGSERIAL PRIMARY KEY,
    cancel_policy_id BIGINT REFERENCES public.cancel_policies(cancel_policy_id) ON DELETE CASCADE,
    min_hours_before_departure NUMERIC(10,2),
    max_hours_before_departure NUMERIC(10,2),
    refund_percentage NUMERIC(5,2),
    cancellation_fee NUMERIC(10,2) DEFAULT 0,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- جدول الحجوزات
CREATE TABLE public.bookings (
    booking_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(user_id) ON DELETE SET NULL,
    trip_id BIGINT REFERENCES public.trips(trip_id) ON DELETE CASCADE,
    cancel_policy_id BIGINT REFERENCES public.cancel_policies(cancel_policy_id),
    booking_date TIMESTAMP DEFAULT NOW(),
    booking_status booking_status DEFAULT 'pending',
    payment_method payment_method,
    payment_status payment_status DEFAULT 'pending',
    total_price NUMERIC(10,2) NOT NULL,
    platform_commission NUMERIC(10,2),
    partner_revenue NUMERIC(10,2),
    gateway_transaction_id VARCHAR(255),
    payment_timestamp TIMESTAMP,
    expires_at TIMESTAMP,
    cancel_reason TEXT,
    cancel_timestamp TIMESTAMP,
    refund_amount NUMERIC(10,2),
    refund_timestamp TIMESTAMP
);

-- جدول الركاب
CREATE TABLE public.passengers (
    passenger_id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT REFERENCES public.bookings(booking_id) ON DELETE CASCADE,
    trip_id BIGINT REFERENCES public.trips(trip_id),
    seat_id BIGINT REFERENCES public.seats(seat_id),
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    id_number VARCHAR(50),
    id_image TEXT,
    birth_date DATE,
    gender gender_type,
    passenger_status VARCHAR(20) DEFAULT 'active',
    cancellation_id BIGINT,
    cancelled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- جدول إلغاءات الحجوزات
CREATE TABLE public.booking_cancellations (
    cancellation_id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT REFERENCES public.bookings(booking_id) ON DELETE CASCADE,
    cancelled_by_user_id BIGINT REFERENCES public.users(user_id),
    cancel_policy_id BIGINT REFERENCES public.cancel_policies(cancel_policy_id),
    rule_id BIGINT REFERENCES public.cancel_policy_rules(rule_id),
    reason TEXT,
    hours_before_departure NUMERIC(10,2),
    original_total NUMERIC(10,2),
    refund_percentage NUMERIC(5,2),
    refund_amount NUMERIC(10,2),
    cancellation_fee NUMERIC(10,2),
    refund_status VARCHAR(50) DEFAULT 'pending',
    cancelled_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- جدول موافقات الحجز
CREATE TABLE public.booking_approvals (
    approval_id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES public.bookings(booking_id),
    employee_id INTEGER REFERENCES public.employees(employee_id),
    action_type VARCHAR(50),
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    notes TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- جدول محطات صعود الحجز
CREATE TABLE public.booking_boarding_stop (
    booking_stop_id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT REFERENCES public.bookings(booking_id) ON DELETE CASCADE,
    stop_id BIGINT REFERENCES public.route_stops(stop_id),
    ready_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- جدول دفتر حسابات الحجز
CREATE TABLE public.booking_ledger (
    ledger_id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT REFERENCES public.bookings(booking_id) ON DELETE CASCADE,
    partner_id BIGINT REFERENCES public.partners(partner_id),
    entry_type ledger_entry_type,
    amount NUMERIC(10,2),
    currency VARCHAR(10) DEFAULT 'SAR',
    note TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- جدول المعاملات المالية
CREATE TABLE public.payment_transactions (
    payment_id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT REFERENCES public.bookings(booking_id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES public.users(user_id),
    amount NUMERIC(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'SAR',
    payment_method VARCHAR(50),
    gateway_name VARCHAR(100),
    gateway_ref VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    raw_response JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- جدول المبالغ المستردة
CREATE TABLE public.refunds (
    refund_id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT REFERENCES public.bookings(booking_id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES public.users(user_id),
    refund_amount NUMERIC(10,2) NOT NULL,
    refund_method VARCHAR(50),
    bank_account VARCHAR(100),
    stc_pay_number VARCHAR(50),
    transaction_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    processed_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- جدول معاملات الاسترداد
CREATE TABLE public.refund_transactions (
    refund_id SERIAL PRIMARY KEY,
    booking_id BIGINT REFERENCES public.bookings(booking_id),
    refund_reference VARCHAR(100),
    refund_status VARCHAR(50) DEFAULT 'pending',
    refund_amount NUMERIC(10,2),
    refund_fee NUMERIC(10,2) DEFAULT 0,
    net_refund NUMERIC(10,2),
    refund_method VARCHAR(50),
    original_payment_method VARCHAR(50),
    original_transaction_id VARCHAR(255),
    bank_name VARCHAR(100),
    bank_account VARCHAR(100),
    account_holder_name VARCHAR(255),
    kareemi_number VARCHAR(50),
    initiated_by BIGINT REFERENCES public.users(user_id),
    processed_by BIGINT REFERENCES public.users(user_id),
    completed_by BIGINT REFERENCES public.users(user_id),
    notes TEXT,
    customer_notes TEXT,
    internal_notes TEXT,
    processing_started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- جدول العمولات
CREATE TABLE public.commissions (
    commission_id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT REFERENCES public.bookings(booking_id) ON DELETE CASCADE,
    partner_id BIGINT REFERENCES public.partners(partner_id),
    trip_id BIGINT REFERENCES public.trips(trip_id),
    booking_amount NUMERIC(10,2),
    commission_percentage NUMERIC(5,2),
    commission_amount NUMERIC(10,2),
    partner_revenue NUMERIC(10,2),
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    payment_date TIMESTAMP,
    calculated_by BIGINT REFERENCES public.users(user_id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- جدول العمولات اليومية
CREATE TABLE public.daily_commissions (
    id BIGSERIAL PRIMARY KEY,
    commission_date DATE NOT NULL,
    total_bookings INTEGER DEFAULT 0,
    total_revenue NUMERIC(12,2) DEFAULT 0,
    total_commission NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- جدول فواتير الشركاء
CREATE TABLE public.partner_invoices (
    invoice_id BIGSERIAL PRIMARY KEY,
    partner_id BIGINT REFERENCES public.partners(partner_id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) UNIQUE,
    period_start DATE,
    period_end DATE,
    total_amount NUMERIC(12,2),
    platform_commission NUMERIC(12,2),
    partner_net NUMERIC(12,2),
    status VARCHAR(50) DEFAULT 'pending',
    invoice_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    paid_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- جدول بنود فاتورة الشريك
CREATE TABLE public.partner_invoice_items (
    item_id BIGSERIAL PRIMARY KEY,
    invoice_id BIGINT REFERENCES public.partner_invoices(invoice_id) ON DELETE CASCADE,
    booking_id BIGINT REFERENCES public.bookings(booking_id),
    booking_amount NUMERIC(10,2),
    commission_amount NUMERIC(10,2)
);

-- جدول مدفوعات الشركاء
CREATE TABLE public.partner_payments (
    payment_id BIGSERIAL PRIMARY KEY,
    partner_id BIGINT REFERENCES public.partners(partner_id) ON DELETE CASCADE,
    invoice_id BIGINT REFERENCES public.partner_invoices(invoice_id),
    payment_amount NUMERIC(12,2),
    payment_method VARCHAR(50),
    reference_number VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    payment_date TIMESTAMP DEFAULT NOW()
);

-- جدول المستندات
CREATE TABLE public.documents (
    document_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(user_id) ON DELETE CASCADE,
    partner_id BIGINT REFERENCES public.partners(partner_id),
    document_type document_type,
    document_number VARCHAR(100),
    document_url VARCHAR(500),
    expiry_date DATE,
    verification_status verification_status DEFAULT 'pending',
    upload_date TIMESTAMP DEFAULT NOW(),
    reviewed_by BIGINT REFERENCES public.users(user_id),
    review_date TIMESTAMP,
    rejection_reason TEXT
);

-- جدول الإشعارات
CREATE TABLE public.notifications (
    notification_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(user_id) ON DELETE CASCADE,
    type notification_type DEFAULT 'system',
    message TEXT NOT NULL,
    related_booking_id BIGINT REFERENCES public.bookings(booking_id),
    is_read BOOLEAN DEFAULT false,
    sent_at TIMESTAMP DEFAULT NOW()
);

-- جدول التقييمات
CREATE TABLE public.ratings (
    rating_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(user_id) ON DELETE CASCADE,
    trip_id BIGINT REFERENCES public.trips(trip_id) ON DELETE CASCADE,
    driver_id BIGINT REFERENCES public.drivers(driver_id),
    partner_id BIGINT REFERENCES public.partners(partner_id),
    stars INTEGER CHECK (stars >= 1 AND stars <= 5),
    comment TEXT,
    rating_date TIMESTAMP DEFAULT NOW()
);

-- جدول تذاكر الدعم
CREATE TABLE public.support_tickets (
    ticket_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(user_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    issue_type VARCHAR(100),
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'open',
    attachment_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- جدول الأسئلة الشائعة
CREATE TABLE public.faqs (
    faq_id BIGSERIAL PRIMARY KEY,
    category VARCHAR(100),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- جدول المحادثات
CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول الرسائل
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول رموز أجهزة المستخدمين
CREATE TABLE public.user_device_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES public.users(user_id) ON DELETE CASCADE,
    device_type VARCHAR(50),
    fcm_token TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- ENABLE RLS (تمكين أمان مستوى الصف)
-- =============================================

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bus_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
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

-- =============================================
-- RLS POLICIES (سياسات الأمان)
-- =============================================

-- سياسات القراءة العامة للبيانات العامة
CREATE POLICY "Public read access for partners" ON public.partners FOR SELECT USING (true);
CREATE POLICY "Public read access for bus_classes" ON public.bus_classes FOR SELECT USING (true);
CREATE POLICY "Public read access for routes" ON public.routes FOR SELECT USING (true);
CREATE POLICY "Public read access for route_stops" ON public.route_stops FOR SELECT USING (true);
CREATE POLICY "Public read access for trips" ON public.trips FOR SELECT USING (true);
CREATE POLICY "Public read access for faqs" ON public.faqs FOR SELECT USING (is_active = true);

-- سياسات المستخدمين المسجلين
CREATE POLICY "Users can view their own data" ON public.users FOR SELECT USING (auth.uid() = auth_id);
CREATE POLICY "Users can update their own data" ON public.users FOR UPDATE USING (auth.uid() = auth_id);

-- سياسات الحجوزات
CREATE POLICY "Users can view their own bookings" ON public.bookings FOR SELECT USING (
    user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid())
);
CREATE POLICY "Users can create bookings" ON public.bookings FOR INSERT WITH CHECK (
    user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid())
);

-- سياسات الركاب
CREATE POLICY "Users can view passengers for their bookings" ON public.passengers FOR SELECT USING (
    booking_id IN (SELECT booking_id FROM public.bookings WHERE user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid()))
);

-- سياسات الإشعارات
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (
    user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid())
);

-- سياسات تذاكر الدعم
CREATE POLICY "Users can view their own tickets" ON public.support_tickets FOR SELECT USING (
    user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid())
);
CREATE POLICY "Users can create tickets" ON public.support_tickets FOR INSERT WITH CHECK (
    user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid())
);

-- سياسات التقييمات
CREATE POLICY "Users can view ratings" ON public.ratings FOR SELECT USING (true);
CREATE POLICY "Users can create ratings" ON public.ratings FOR INSERT WITH CHECK (
    user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid())
);

-- سياسات الفروع والحافلات والموظفين (للشركاء)
CREATE POLICY "Public read access for branches" ON public.branches FOR SELECT USING (true);
CREATE POLICY "Public read access for buses" ON public.buses FOR SELECT USING (true);
CREATE POLICY "Public read access for seats" ON public.seats FOR SELECT USING (true);
CREATE POLICY "Public read access for drivers" ON public.drivers FOR SELECT USING (true);

-- سياسات للموظفين
CREATE POLICY "Employees can view employee data" ON public.employees FOR SELECT USING (true);

-- سياسات سياسات الإلغاء
CREATE POLICY "Public read access for cancel_policies" ON public.cancel_policies FOR SELECT USING (is_active = true);
CREATE POLICY "Public read access for cancel_policy_rules" ON public.cancel_policy_rules FOR SELECT USING (is_active = true);

-- سياسات المحادثات والرسائل
CREATE POLICY "Users can view their own conversations" ON public.conversations FOR SELECT USING (true);
CREATE POLICY "Users can view messages" ON public.messages FOR SELECT USING (true);

-- سياسات العمولات والفواتير (للإدارة فقط - سيتم تعديلها لاحقاً)
CREATE POLICY "Read access for commissions" ON public.commissions FOR SELECT USING (true);
CREATE POLICY "Read access for daily_commissions" ON public.daily_commissions FOR SELECT USING (true);
CREATE POLICY "Read access for partner_invoices" ON public.partner_invoices FOR SELECT USING (true);
CREATE POLICY "Read access for partner_invoice_items" ON public.partner_invoice_items FOR SELECT USING (true);
CREATE POLICY "Read access for partner_payments" ON public.partner_payments FOR SELECT USING (true);
CREATE POLICY "Read access for payment_transactions" ON public.payment_transactions FOR SELECT USING (true);
CREATE POLICY "Read access for refunds" ON public.refunds FOR SELECT USING (true);
CREATE POLICY "Read access for refund_transactions" ON public.refund_transactions FOR SELECT USING (true);
CREATE POLICY "Read access for booking_cancellations" ON public.booking_cancellations FOR SELECT USING (true);
CREATE POLICY "Read access for booking_approvals" ON public.booking_approvals FOR SELECT USING (true);
CREATE POLICY "Read access for booking_boarding_stop" ON public.booking_boarding_stop FOR SELECT USING (true);
CREATE POLICY "Read access for booking_ledger" ON public.booking_ledger FOR SELECT USING (true);
CREATE POLICY "Read access for documents" ON public.documents FOR SELECT USING (true);
CREATE POLICY "Read access for user_device_tokens" ON public.user_device_tokens FOR SELECT USING (true);

-- =============================================
-- INDEXES (الفهارس لتحسين الأداء)
-- =============================================

CREATE INDEX idx_users_auth_id ON public.users(auth_id);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_phone ON public.users(phone_number);
CREATE INDEX idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX idx_bookings_trip_id ON public.bookings(trip_id);
CREATE INDEX idx_trips_route_id ON public.trips(route_id);
CREATE INDEX idx_trips_departure ON public.trips(departure_time);
CREATE INDEX idx_passengers_booking_id ON public.passengers(booking_id);
CREATE INDEX idx_routes_cities ON public.routes(origin_city, destination_city);

-- =============================================
-- FUNCTIONS (الدوال)
-- =============================================

-- دالة تحديث updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =============================================
-- TRIGGERS (المحفزات)
-- =============================================

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_routes_updated_at
    BEFORE UPDATE ON public.routes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_route_stops_updated_at
    BEFORE UPDATE ON public.route_stops
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trips_updated_at
    BEFORE UPDATE ON public.trips
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cancel_policies_updated_at
    BEFORE UPDATE ON public.cancel_policies
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at
    BEFORE UPDATE ON public.support_tickets
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_faqs_updated_at
    BEFORE UPDATE ON public.faqs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
