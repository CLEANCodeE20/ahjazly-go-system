-- =============================================
-- هيكل قاعدة البيانات - نظام حجز الحافلات
-- تاريخ التصدير: 2024-12-24
-- =============================================

-- =============================================
-- 1. ENUMS (أنواع البيانات المخصصة)
-- =============================================

CREATE TYPE app_role AS ENUM ('admin', 'partner', 'driver', 'customer');
CREATE TYPE partner_status AS ENUM ('pending', 'active', 'suspended', 'rejected');
CREATE TYPE bus_status AS ENUM ('active', 'maintenance', 'retired');
CREATE TYPE bus_type AS ENUM ('standard', 'vip', 'luxury');
CREATE TYPE trip_status AS ENUM ('scheduled', 'boarding', 'departed', 'arrived', 'cancelled');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'refunded', 'failed');
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'bank_transfer', 'stc_pay');
CREATE TYPE notification_type AS ENUM ('system', 'booking', 'payment', 'trip');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE document_type AS ENUM ('commercial_register', 'tax_certificate', 'license', 'id_card');
CREATE TYPE gender AS ENUM ('male', 'female');
CREATE TYPE ledger_entry_type AS ENUM ('booking', 'refund', 'commission', 'payout');

-- =============================================
-- 2. FUNCTIONS (الدوال)
-- =============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$function$;

CREATE OR REPLACE FUNCTION public.get_user_partner_id(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT partner_id
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$function$;

CREATE OR REPLACE FUNCTION public.is_first_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE role = 'admin'
  )
$function$;

CREATE OR REPLACE FUNCTION public.get_current_partner_id()
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT partner_id FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1
$function$;

-- =============================================
-- 3. TABLES (الجداول)
-- =============================================

-- جدول أدوار المستخدمين
CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  partner_id integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- جدول الشركاء
CREATE TABLE public.partners (
  partner_id bigint NOT NULL DEFAULT nextval('partners_partner_id_seq'::regclass) PRIMARY KEY,
  company_name character varying NOT NULL,
  contact_person character varying,
  address text,
  commission_percentage numeric DEFAULT 10.00,
  status partner_status DEFAULT 'pending',
  application_documents_url text,
  created_at timestamp without time zone DEFAULT now()
);

-- جدول طلبات الشراكة
CREATE TABLE public.partner_applications (
  application_id integer NOT NULL DEFAULT nextval('partner_applications_application_id_seq'::regclass) PRIMARY KEY,
  company_name text NOT NULL,
  company_city text NOT NULL,
  company_address text,
  company_phone text,
  company_email text,
  owner_name text NOT NULL,
  owner_phone text NOT NULL,
  owner_email text NOT NULL,
  owner_id_number text,
  fleet_size integer,
  description text,
  commercial_register_url text,
  tax_certificate_url text,
  status text NOT NULL DEFAULT 'pending',
  rejection_reason text,
  auth_user_id uuid,
  partner_id integer,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- جدول الفروع
CREATE TABLE public.branches (
  branch_id bigint NOT NULL DEFAULT nextval('branches_branch_id_seq'::regclass) PRIMARY KEY,
  branch_name character varying NOT NULL,
  partner_id bigint,
  city character varying,
  address text,
  phone character varying,
  status character varying DEFAULT 'active',
  created_at timestamp without time zone DEFAULT now()
);

-- جدول المستخدمين
CREATE TABLE public.users (
  user_id bigint NOT NULL DEFAULT nextval('users_user_id_seq'::regclass) PRIMARY KEY,
  auth_id uuid,
  full_name character varying,
  email character varying,
  phone character varying,
  created_at timestamp without time zone DEFAULT now()
);

-- جدول الموظفين
CREATE TABLE public.employees (
  employee_id bigint NOT NULL DEFAULT nextval('employees_employee_id_seq'::regclass) PRIMARY KEY,
  user_id bigint,
  partner_id bigint,
  branch_id bigint,
  role_in_company character varying,
  status character varying DEFAULT 'active',
  created_at timestamp without time zone DEFAULT now()
);

-- جدول السائقين
CREATE TABLE public.drivers (
  driver_id bigint NOT NULL DEFAULT nextval('drivers_driver_id_seq'::regclass) PRIMARY KEY,
  full_name character varying NOT NULL,
  phone_number character varying,
  license_number character varying,
  license_expiry date,
  partner_id bigint,
  status character varying DEFAULT 'active',
  created_at timestamp without time zone DEFAULT now()
);

-- جدول فئات الحافلات
CREATE TABLE public.bus_classes (
  bus_class_id bigint NOT NULL DEFAULT nextval('bus_classes_bus_class_id_seq'::regclass) PRIMARY KEY,
  class_name character varying NOT NULL,
  description text,
  price_adjustment_factor numeric DEFAULT 1.00
);

-- جدول الحافلات
CREATE TABLE public.buses (
  bus_id bigint NOT NULL DEFAULT nextval('buses_bus_id_seq'::regclass) PRIMARY KEY,
  license_plate character varying NOT NULL,
  model character varying,
  capacity integer DEFAULT 40,
  bus_type bus_type DEFAULT 'standard',
  bus_class_id bigint,
  partner_id bigint,
  owner_user_id bigint,
  status bus_status DEFAULT 'active',
  created_at timestamp without time zone DEFAULT now()
);

-- جدول المقاعد
CREATE TABLE public.seats (
  seat_id bigint NOT NULL DEFAULT nextval('seats_seat_id_seq'::regclass) PRIMARY KEY,
  bus_id bigint,
  seat_number character varying NOT NULL,
  price_adjustment_factor numeric DEFAULT 1.00,
  is_available boolean DEFAULT true
);

-- جدول المسارات
CREATE TABLE public.routes (
  route_id bigint NOT NULL DEFAULT nextval('routes_route_id_seq'::regclass) PRIMARY KEY,
  origin_city character varying NOT NULL,
  destination_city character varying NOT NULL,
  distance_km numeric,
  estimated_duration_hours numeric,
  partner_id bigint,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now()
);

-- جدول محطات المسار
CREATE TABLE public.route_stops (
  stop_id bigint NOT NULL DEFAULT nextval('route_stops_stop_id_seq'::regclass) PRIMARY KEY,
  route_id bigint,
  stop_name character varying NOT NULL,
  stop_location character varying,
  stop_order integer,
  preparation_time time without time zone,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now()
);

-- جدول الرحلات
CREATE TABLE public.trips (
  trip_id bigint NOT NULL DEFAULT nextval('trips_trip_id_seq'::regclass) PRIMARY KEY,
  route_id bigint,
  bus_id bigint,
  driver_id bigint,
  partner_id bigint,
  departure_time timestamp without time zone NOT NULL,
  arrival_time timestamp without time zone,
  base_price numeric NOT NULL,
  status trip_status DEFAULT 'scheduled',
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now()
);

-- جدول سياسات الإلغاء
CREATE TABLE public.cancel_policies (
  cancel_policy_id bigint NOT NULL DEFAULT nextval('cancel_policies_cancel_policy_id_seq'::regclass) PRIMARY KEY,
  policy_name character varying NOT NULL,
  description text,
  days_before_trip integer DEFAULT 0,
  refund_percentage numeric DEFAULT 100.00,
  partner_id bigint,
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  priority integer DEFAULT 0,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now()
);

-- جدول قواعد سياسات الإلغاء
CREATE TABLE public.cancel_policy_rules (
  rule_id bigint NOT NULL DEFAULT nextval('cancel_policy_rules_rule_id_seq'::regclass) PRIMARY KEY,
  cancel_policy_id bigint,
  min_hours_before_departure numeric,
  max_hours_before_departure numeric,
  refund_percentage numeric,
  cancellation_fee numeric DEFAULT 0,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now()
);

-- جدول الحجوزات
CREATE TABLE public.bookings (
  booking_id bigint NOT NULL DEFAULT nextval('bookings_booking_id_seq'::regclass) PRIMARY KEY,
  user_id bigint,
  trip_id bigint,
  cancel_policy_id bigint,
  booking_date timestamp without time zone DEFAULT now(),
  booking_status booking_status DEFAULT 'pending',
  payment_method payment_method,
  payment_status payment_status DEFAULT 'pending',
  total_price numeric NOT NULL,
  platform_commission numeric,
  partner_revenue numeric,
  payment_timestamp timestamp without time zone,
  gateway_transaction_id character varying,
  cancel_reason text,
  cancel_timestamp timestamp without time zone,
  refund_amount numeric,
  refund_timestamp timestamp without time zone,
  expires_at timestamp without time zone
);

-- جدول الركاب
CREATE TABLE public.passengers (
  passenger_id bigint NOT NULL DEFAULT nextval('passengers_passenger_id_seq'::regclass) PRIMARY KEY,
  booking_id bigint,
  trip_id bigint,
  seat_id bigint,
  full_name character varying NOT NULL,
  id_number character varying,
  phone_number character varying,
  gender gender,
  birth_date date,
  id_image text,
  passenger_status character varying DEFAULT 'active',
  cancellation_id bigint,
  cancelled_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT now()
);

-- جدول محطات الصعود للحجز
CREATE TABLE public.booking_boarding_stop (
  booking_stop_id bigint NOT NULL DEFAULT nextval('booking_boarding_stop_booking_stop_id_seq'::regclass) PRIMARY KEY,
  booking_id bigint,
  stop_id bigint,
  ready_time timestamp without time zone,
  created_at timestamp without time zone DEFAULT now()
);

-- جدول إلغاءات الحجز
CREATE TABLE public.booking_cancellations (
  cancellation_id bigint NOT NULL DEFAULT nextval('booking_cancellations_cancellation_id_seq'::regclass) PRIMARY KEY,
  booking_id bigint,
  cancel_policy_id bigint,
  rule_id bigint,
  cancelled_by_user_id bigint,
  reason text,
  original_total numeric,
  hours_before_departure numeric,
  refund_percentage numeric,
  cancellation_fee numeric,
  refund_amount numeric,
  refund_status character varying DEFAULT 'pending',
  cancelled_at timestamp without time zone DEFAULT now(),
  created_at timestamp without time zone DEFAULT now()
);

-- جدول موافقات الحجز
CREATE TABLE public.booking_approvals (
  approval_id integer NOT NULL DEFAULT nextval('booking_approvals_approval_id_seq'::regclass) PRIMARY KEY,
  booking_id integer,
  employee_id integer,
  action_type character varying,
  old_status character varying,
  new_status character varying,
  notes text,
  ip_address character varying,
  created_at timestamp without time zone DEFAULT now()
);

-- جدول العمولات
CREATE TABLE public.commissions (
  commission_id bigint NOT NULL DEFAULT nextval('commissions_commission_id_seq'::regclass) PRIMARY KEY,
  booking_id bigint,
  partner_id bigint,
  trip_id bigint,
  booking_amount numeric,
  commission_percentage numeric,
  commission_amount numeric,
  partner_revenue numeric,
  status character varying DEFAULT 'pending',
  calculated_by bigint,
  payment_date timestamp without time zone,
  notes text,
  created_at timestamp without time zone DEFAULT now()
);

-- جدول العمولات اليومية
CREATE TABLE public.daily_commissions (
  id bigint NOT NULL DEFAULT nextval('daily_commissions_id_seq'::regclass) PRIMARY KEY,
  commission_date date NOT NULL,
  total_bookings integer DEFAULT 0,
  total_revenue numeric DEFAULT 0,
  total_commission numeric DEFAULT 0,
  created_at timestamp without time zone DEFAULT now()
);

-- جدول دفتر الحجوزات
CREATE TABLE public.booking_ledger (
  ledger_id bigint NOT NULL DEFAULT nextval('booking_ledger_ledger_id_seq'::regclass) PRIMARY KEY,
  booking_id bigint,
  partner_id bigint,
  amount numeric,
  entry_type ledger_entry_type,
  currency character varying DEFAULT 'SAR',
  note text,
  created_at timestamp without time zone DEFAULT now()
);

-- جدول معاملات الدفع
CREATE TABLE public.payment_transactions (
  payment_id bigint NOT NULL DEFAULT nextval('payment_transactions_payment_id_seq'::regclass) PRIMARY KEY,
  booking_id bigint,
  user_id bigint,
  amount numeric NOT NULL,
  currency character varying DEFAULT 'SAR',
  payment_method character varying,
  gateway_name character varying,
  gateway_ref character varying,
  status character varying DEFAULT 'pending',
  raw_response jsonb,
  created_at timestamp without time zone DEFAULT now()
);

-- جدول المستردات
CREATE TABLE public.refunds (
  refund_id bigint NOT NULL DEFAULT nextval('refunds_refund_id_seq'::regclass) PRIMARY KEY,
  booking_id bigint,
  user_id bigint,
  refund_amount numeric NOT NULL,
  refund_method character varying,
  bank_account character varying,
  stc_pay_number character varying,
  transaction_id character varying,
  status character varying DEFAULT 'pending',
  processed_at timestamp without time zone,
  completed_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT now()
);

-- جدول معاملات الاسترداد
CREATE TABLE public.refund_transactions (
  refund_id integer NOT NULL DEFAULT nextval('refund_transactions_refund_id_seq'::regclass) PRIMARY KEY,
  booking_id bigint,
  refund_amount numeric,
  refund_fee numeric DEFAULT 0,
  net_refund numeric,
  original_payment_method character varying,
  original_transaction_id character varying,
  refund_method character varying,
  refund_status character varying DEFAULT 'pending',
  refund_reference character varying,
  bank_name character varying,
  bank_account character varying,
  account_holder_name character varying,
  kareemi_number character varying,
  initiated_by bigint,
  processed_by bigint,
  completed_by bigint,
  notes text,
  customer_notes text,
  internal_notes text,
  processing_started_at timestamp without time zone,
  completed_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT now()
);

-- جدول فواتير الشركاء
CREATE TABLE public.partner_invoices (
  invoice_id bigint NOT NULL DEFAULT nextval('partner_invoices_invoice_id_seq'::regclass) PRIMARY KEY,
  partner_id bigint,
  invoice_number character varying,
  invoice_date date DEFAULT CURRENT_DATE,
  period_start date,
  period_end date,
  total_amount numeric,
  platform_commission numeric,
  partner_net numeric,
  due_date date,
  status character varying DEFAULT 'pending',
  paid_date timestamp without time zone,
  created_at timestamp without time zone DEFAULT now()
);

-- جدول بنود فواتير الشركاء
CREATE TABLE public.partner_invoice_items (
  item_id bigint NOT NULL DEFAULT nextval('partner_invoice_items_item_id_seq'::regclass) PRIMARY KEY,
  invoice_id bigint,
  booking_id bigint,
  booking_amount numeric,
  commission_amount numeric
);

-- جدول مدفوعات الشركاء
CREATE TABLE public.partner_payments (
  payment_id bigint NOT NULL DEFAULT nextval('partner_payments_payment_id_seq'::regclass) PRIMARY KEY,
  partner_id bigint,
  invoice_id bigint,
  payment_amount numeric,
  payment_method character varying,
  reference_number character varying,
  status character varying DEFAULT 'pending',
  payment_date timestamp without time zone DEFAULT now()
);

-- جدول الوثائق
CREATE TABLE public.documents (
  document_id bigint NOT NULL DEFAULT nextval('documents_document_id_seq'::regclass) PRIMARY KEY,
  user_id bigint,
  partner_id bigint,
  document_type document_type,
  document_number character varying,
  document_url character varying,
  expiry_date date,
  verification_status verification_status DEFAULT 'pending',
  rejection_reason text,
  reviewed_by bigint,
  review_date timestamp without time zone,
  upload_date timestamp without time zone DEFAULT now()
);

-- جدول الإشعارات
CREATE TABLE public.notifications (
  notification_id bigint NOT NULL DEFAULT nextval('notifications_notification_id_seq'::regclass) PRIMARY KEY,
  user_id bigint,
  type notification_type DEFAULT 'system',
  message text NOT NULL,
  is_read boolean DEFAULT false,
  related_booking_id bigint,
  sent_at timestamp without time zone DEFAULT now()
);

-- جدول التقييمات
CREATE TABLE public.ratings (
  rating_id bigint NOT NULL DEFAULT nextval('ratings_rating_id_seq'::regclass) PRIMARY KEY,
  user_id bigint,
  trip_id bigint,
  partner_id bigint,
  driver_id bigint,
  stars integer,
  comment text,
  rating_date timestamp without time zone DEFAULT now()
);

-- جدول تذاكر الدعم
CREATE TABLE public.support_tickets (
  ticket_id bigint NOT NULL DEFAULT nextval('support_tickets_ticket_id_seq'::regclass) PRIMARY KEY,
  user_id bigint,
  title character varying NOT NULL,
  description text,
  issue_type character varying,
  priority character varying DEFAULT 'medium',
  status character varying DEFAULT 'open',
  attachment_url text,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now()
);

-- جدول الأسئلة الشائعة
CREATE TABLE public.faqs (
  faq_id bigint NOT NULL DEFAULT nextval('faqs_faq_id_seq'::regclass) PRIMARY KEY,
  question text NOT NULL,
  answer text NOT NULL,
  category character varying,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now()
);

-- جدول توكنات أجهزة المستخدمين
CREATE TABLE public.user_device_tokens (
  id integer NOT NULL DEFAULT nextval('user_device_tokens_id_seq'::regclass) PRIMARY KEY,
  user_id integer,
  fcm_token text,
  device_type character varying,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now()
);

-- جدول المحادثات
CREATE TABLE public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id character varying,
  started_at timestamp with time zone DEFAULT now(),
  last_activity_at timestamp with time zone DEFAULT now()
);

-- جدول الرسائل
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid,
  role character varying NOT NULL,
  content text NOT NULL,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- =============================================
-- 4. TRIGGERS (المُحفّزات)
-- =============================================

-- تحديث updated_at تلقائياً
CREATE TRIGGER update_routes_updated_at
  BEFORE UPDATE ON public.routes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_route_stops_updated_at
  BEFORE UPDATE ON public.route_stops
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cancel_policies_updated_at
  BEFORE UPDATE ON public.cancel_policies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_faqs_updated_at
  BEFORE UPDATE ON public.faqs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 5. RLS POLICIES (سياسات أمان الصفوف)
-- =============================================

-- تفعيل RLS على جميع الجداول
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- سياسات user_roles
CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- سياسات partners
CREATE POLICY "Partners can view own data" ON public.partners
  FOR SELECT USING ((partner_id = get_current_partner_id()) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Partners can update own data" ON public.partners
  FOR UPDATE USING (partner_id = get_current_partner_id())
  WITH CHECK (partner_id = get_current_partner_id());

-- سياسات partner_applications
CREATE POLICY "Anyone can submit application" ON public.partner_applications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own application" ON public.partner_applications
  FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY "Admins can manage all applications" ON public.partner_applications
  FOR ALL USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- سياسات branches
CREATE POLICY "Partners can view own branches" ON public.branches
  FOR SELECT USING ((partner_id = get_current_partner_id()) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Partners can manage own branches" ON public.branches
  FOR ALL USING (partner_id = get_current_partner_id())
  WITH CHECK (partner_id = get_current_partner_id());

-- سياسات drivers
CREATE POLICY "Partners can view own drivers" ON public.drivers
  FOR SELECT USING ((partner_id = get_current_partner_id()) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Partners can manage own drivers" ON public.drivers
  FOR ALL USING (partner_id = get_current_partner_id())
  WITH CHECK (partner_id = get_current_partner_id());

-- سياسات buses
CREATE POLICY "Partners can view own buses" ON public.buses
  FOR SELECT USING ((partner_id = get_current_partner_id()) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Partners can manage own buses" ON public.buses
  FOR ALL USING (partner_id = get_current_partner_id())
  WITH CHECK (partner_id = get_current_partner_id());

-- سياسات routes
CREATE POLICY "Partners can view own routes" ON public.routes
  FOR SELECT USING ((partner_id = get_current_partner_id()) OR (partner_id IS NULL) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Partners can manage own routes" ON public.routes
  FOR ALL USING ((partner_id = get_current_partner_id()) OR (partner_id IS NULL))
  WITH CHECK ((partner_id = get_current_partner_id()) OR (partner_id IS NULL));

-- سياسات trips
CREATE POLICY "Partners can view own trips" ON public.trips
  FOR SELECT USING ((partner_id = get_current_partner_id()) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Partners can manage own trips" ON public.trips
  FOR ALL USING (partner_id = get_current_partner_id())
  WITH CHECK (partner_id = get_current_partner_id());

-- سياسات bookings
CREATE POLICY "Users can view their own bookings" ON public.bookings
  FOR SELECT USING (user_id IN (SELECT user_id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (user_id IN (SELECT user_id FROM users WHERE auth_id = auth.uid()));

-- سياسات commissions
CREATE POLICY "Partners can view own commissions" ON public.commissions
  FOR SELECT USING ((partner_id = get_current_partner_id()) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all commissions" ON public.commissions
  FOR ALL USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- سياسات notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (user_id IN (SELECT user_id FROM users WHERE auth_id = auth.uid()));

-- سياسات ratings
CREATE POLICY "Users can view ratings" ON public.ratings
  FOR SELECT USING (true);

CREATE POLICY "Users can create ratings" ON public.ratings
  FOR INSERT WITH CHECK (user_id IN (SELECT user_id FROM users WHERE auth_id = auth.uid()));

-- سياسات support_tickets
CREATE POLICY "Users can view their own tickets" ON public.support_tickets
  FOR SELECT USING (user_id IN (SELECT user_id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can create tickets" ON public.support_tickets
  FOR INSERT WITH CHECK (user_id IN (SELECT user_id FROM users WHERE auth_id = auth.uid()));

-- سياسات القراءة العامة
CREATE POLICY "Public read access for bus_classes" ON public.bus_classes FOR SELECT USING (true);
CREATE POLICY "Public read access for seats" ON public.seats FOR SELECT USING (true);
CREATE POLICY "Public read access for cancel_policies" ON public.cancel_policies FOR SELECT USING (is_active = true);
CREATE POLICY "Public read access for cancel_policy_rules" ON public.cancel_policy_rules FOR SELECT USING (is_active = true);
CREATE POLICY "Public read access for faqs" ON public.faqs FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view route stops" ON public.route_stops FOR SELECT USING (true);

-- =============================================
-- 6. STORAGE BUCKET
-- =============================================

-- إنشاء bucket لوثائق الشركاء
INSERT INTO storage.buckets (id, name, public) VALUES ('partner-documents', 'partner-documents', false);

-- سياسات التخزين
CREATE POLICY "Partners can upload documents" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'partner-documents');

CREATE POLICY "Partners can view own documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'partner-documents');

-- =============================================
-- تم التصدير بنجاح!
-- =============================================
