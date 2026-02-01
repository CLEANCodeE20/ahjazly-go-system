-- =============================================
-- نظام السائقين الاحترافي - Migration رئيسي
-- =============================================

-- 1. تعديل جدول drivers لإضافة user_id والحقول الاحترافية
ALTER TABLE public.drivers 
ADD COLUMN IF NOT EXISTS user_id BIGINT UNIQUE REFERENCES public.users(user_id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS employment_type VARCHAR(20) DEFAULT 'full_time' CHECK (employment_type IN ('full_time', 'part_time', 'contractor')),
ADD COLUMN IF NOT EXISTS hire_date DATE,
ADD COLUMN IF NOT EXISTS termination_date DATE,
ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS blood_type VARCHAR(5),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. إنشاء فهرس لـ user_id
CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON public.drivers(user_id);

-- 3. جدول إعدادات السائق
CREATE TABLE IF NOT EXISTS public.driver_settings (
    setting_id BIGSERIAL PRIMARY KEY,
    driver_id BIGINT UNIQUE NOT NULL REFERENCES public.drivers(driver_id) ON DELETE CASCADE,
    
    -- إعدادات الإشعارات
    notify_new_trip BOOLEAN DEFAULT true,
    notify_trip_change BOOLEAN DEFAULT true,
    notify_passenger_message BOOLEAN DEFAULT true,
    notify_before_trip_minutes INTEGER DEFAULT 30,
    
    -- إعدادات العمل
    max_trips_per_day INTEGER DEFAULT 10,
    preferred_routes JSONB DEFAULT '[]'::jsonb,
    
    -- إعدادات التطبيق
    language VARCHAR(10) DEFAULT 'ar' CHECK (language IN ('ar', 'en')),
    theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. جدول أداء السائق
CREATE TABLE IF NOT EXISTS public.driver_performance (
    performance_id BIGSERIAL PRIMARY KEY,
    driver_id BIGINT NOT NULL REFERENCES public.drivers(driver_id) ON DELETE CASCADE,
    
    -- الفترة الزمنية
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- إحصائيات الرحلات
    total_trips INTEGER DEFAULT 0,
    completed_trips INTEGER DEFAULT 0,
    cancelled_trips INTEGER DEFAULT 0,
    delayed_trips INTEGER DEFAULT 0,
    
    -- التقييمات
    average_rating NUMERIC(3,2) CHECK (average_rating >= 0 AND average_rating <= 5),
    total_ratings INTEGER DEFAULT 0,
    five_star_count INTEGER DEFAULT 0,
    four_star_count INTEGER DEFAULT 0,
    three_star_count INTEGER DEFAULT 0,
    two_star_count INTEGER DEFAULT 0,
    one_star_count INTEGER DEFAULT 0,
    
    -- الالتزام بالمواعيد
    on_time_trips INTEGER DEFAULT 0,
    on_time_percentage NUMERIC(5,2),
    average_delay_minutes NUMERIC(10,2),
    
    -- الأرباح (إذا كان بنظام العمولة)
    total_earnings NUMERIC(10,2) DEFAULT 0,
    commission_earned NUMERIC(10,2) DEFAULT 0,
    
    -- الركاب
    total_passengers INTEGER DEFAULT 0,
    
    calculated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(driver_id, period_start, period_end)
);

-- 5. جدول مستندات السائق
CREATE TABLE IF NOT EXISTS public.driver_documents (
    document_id BIGSERIAL PRIMARY KEY,
    driver_id BIGINT NOT NULL REFERENCES public.drivers(driver_id) ON DELETE CASCADE,
    
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN (
        'license', 'national_id', 'health_certificate', 
        'criminal_record', 'contract', 'other'
    )),
    document_name VARCHAR(255),
    document_url TEXT NOT NULL,
    
    -- معلومات الانتهاء
    issue_date DATE,
    expiry_date DATE,
    
    -- حالة التحقق
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN (
        'pending', 'approved', 'rejected', 'expired'
    )),
    rejection_reason TEXT,
    
    -- معلومات التحقق
    uploaded_by BIGINT REFERENCES public.users(user_id),
    uploaded_at TIMESTAMP DEFAULT NOW(),
    verified_by BIGINT REFERENCES public.users(user_id),
    verified_at TIMESTAMP,
    
    notes TEXT
);

-- 6. جدول سجل حالات الرحلة (للتتبع)
CREATE TABLE IF NOT EXISTS public.trip_status_history (
    history_id BIGSERIAL PRIMARY KEY,
    trip_id BIGINT NOT NULL REFERENCES public.trips(trip_id) ON DELETE CASCADE,
    driver_id BIGINT REFERENCES public.drivers(driver_id),
    
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    
    changed_by BIGINT REFERENCES public.users(user_id),
    changed_at TIMESTAMP DEFAULT NOW(),
    
    location_lat NUMERIC(10,8),
    location_lng NUMERIC(11,8),
    notes TEXT
);

-- 7. جدول تسجيل صعود الركاب
CREATE TABLE IF NOT EXISTS public.passenger_boarding_log (
    log_id BIGSERIAL PRIMARY KEY,
    passenger_id BIGINT NOT NULL REFERENCES public.passengers(passenger_id) ON DELETE CASCADE,
    trip_id BIGINT NOT NULL REFERENCES public.trips(trip_id) ON DELETE CASCADE,
    driver_id BIGINT NOT NULL REFERENCES public.drivers(driver_id),
    
    boarding_method VARCHAR(20) DEFAULT 'manual' CHECK (boarding_method IN ('qr_code', 'manual', 'ticket_number')),
    boarding_time TIMESTAMP DEFAULT NOW(),
    
    location_lat NUMERIC(10,8),
    location_lng NUMERIC(11,8),
    
    notes TEXT
);

-- =============================================
-- INDEXES للأداء
-- =============================================

CREATE INDEX IF NOT EXISTS idx_driver_performance_driver ON public.driver_performance(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_performance_period ON public.driver_performance(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_driver_documents_driver ON public.driver_documents(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_documents_status ON public.driver_documents(verification_status);
CREATE INDEX IF NOT EXISTS idx_trip_status_history_trip ON public.trip_status_history(trip_id);
CREATE INDEX IF NOT EXISTS idx_passenger_boarding_trip ON public.passenger_boarding_log(trip_id);

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger لتحديث updated_at في driver_settings
CREATE OR REPLACE FUNCTION update_driver_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_driver_settings_timestamp
    BEFORE UPDATE ON public.driver_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_driver_settings_timestamp();

-- =============================================
-- ENABLE RLS
-- =============================================

ALTER TABLE public.driver_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passenger_boarding_log ENABLE ROW LEVEL SECURITY;

-- =============================================
-- COMMENTS للتوثيق
-- =============================================

COMMENT ON TABLE public.driver_settings IS 'إعدادات وتفضيلات السائق';
COMMENT ON TABLE public.driver_performance IS 'إحصائيات وأداء السائق لفترة زمنية محددة';
COMMENT ON TABLE public.driver_documents IS 'مستندات السائق (رخصة، هوية، شهادات)';
COMMENT ON TABLE public.trip_status_history IS 'سجل تغييرات حالة الرحلة للتتبع';
COMMENT ON TABLE public.passenger_boarding_log IS 'سجل صعود الركاب مع الوقت والموقع';
