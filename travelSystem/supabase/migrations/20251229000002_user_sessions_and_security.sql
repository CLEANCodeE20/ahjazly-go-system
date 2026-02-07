-- =============================================
-- User Sessions and Security Tables
-- جداول الجلسات والأمان
-- =============================================

-- 1. User Sessions Table
-- جدول جلسات المستخدم

CREATE TABLE IF NOT EXISTS public.user_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT REFERENCES public.users(user_id) ON DELETE CASCADE,
    auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    device_name VARCHAR(255),
    device_type VARCHAR(50), -- 'mobile', 'tablet', 'desktop'
    browser VARCHAR(100),
    os VARCHAR(100),
    ip_address INET,
    location JSONB, -- {country, city, lat, lng}
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    last_activity_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    revoked_at TIMESTAMP,
    revoked_by BIGINT REFERENCES public.users(user_id)
);

-- 2. User Activity Log Table
-- جدول سجل أنشطة المستخدم

CREATE TABLE IF NOT EXISTS public.user_activity_log (
    activity_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(user_id) ON DELETE CASCADE,
    auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL, -- 'login', 'logout', 'profile_update', 'password_change', etc.
    activity_category VARCHAR(50), -- 'authentication', 'profile', 'security', 'booking', etc.
    description TEXT,
    metadata JSONB, -- Additional context
    ip_address INET,
    user_agent TEXT,
    status VARCHAR(20) DEFAULT 'success', -- 'success', 'failed', 'pending'
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. User Login History Table
-- جدول سجل تسجيلات الدخول

CREATE TABLE IF NOT EXISTS public.user_login_history (
    login_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(user_id) ON DELETE CASCADE,
    auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    login_method VARCHAR(50), -- 'email_password', 'phone_otp', 'social', '2fa'
    device_info JSONB,
    ip_address INET,
    location JSONB,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    failure_reason TEXT,
    session_id UUID REFERENCES public.user_sessions(session_id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. User Verification Codes Table
-- جدول رموز التحقق

CREATE TABLE IF NOT EXISTS public.user_verification_codes (
    verification_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(user_id) ON DELETE CASCADE,
    auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    code VARCHAR(10) NOT NULL,
    verification_type VARCHAR(50) NOT NULL, -- 'email', 'phone', 'password_reset', '2fa_setup'
    contact_info VARCHAR(255), -- email or phone number
    is_used BOOLEAN DEFAULT false,
    used_at TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. User Two-Factor Authentication Table
-- جدول المصادقة الثنائية

CREATE TABLE IF NOT EXISTS public.user_two_factor (
    two_factor_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(user_id) ON DELETE CASCADE,
    auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    method VARCHAR(50) NOT NULL, -- 'totp', 'sms', 'email'
    secret_key TEXT, -- Encrypted TOTP secret
    backup_codes JSONB, -- Array of encrypted backup codes
    is_enabled BOOLEAN DEFAULT false,
    enabled_at TIMESTAMP,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. User Trusted Devices Table
-- جدول الأجهزة الموثوقة

CREATE TABLE IF NOT EXISTS public.user_trusted_devices (
    device_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT REFERENCES public.users(user_id) ON DELETE CASCADE,
    auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    device_fingerprint TEXT UNIQUE NOT NULL,
    device_name VARCHAR(255),
    device_info JSONB,
    is_trusted BOOLEAN DEFAULT true,
    trusted_at TIMESTAMP DEFAULT NOW(),
    last_seen_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================

-- Sessions indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_auth_id ON public.user_sessions(auth_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON public.user_sessions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_sessions_created ON public.user_sessions(created_at DESC);

-- Activity log indexes
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON public.user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_auth_id ON public.user_activity_log(auth_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON public.user_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_created ON public.user_activity_log(created_at DESC);

-- Login history indexes
CREATE INDEX IF NOT EXISTS idx_user_login_user_id ON public.user_login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_login_auth_id ON public.user_login_history(auth_id);
CREATE INDEX IF NOT EXISTS idx_user_login_created ON public.user_login_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_login_success ON public.user_login_history(success);

-- Verification codes indexes
CREATE INDEX IF NOT EXISTS idx_verification_user_id ON public.user_verification_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_code ON public.user_verification_codes(code);
CREATE INDEX IF NOT EXISTS idx_verification_type ON public.user_verification_codes(verification_type);
CREATE INDEX IF NOT EXISTS idx_verification_expires ON public.user_verification_codes(expires_at);

-- Two-factor indexes
CREATE INDEX IF NOT EXISTS idx_two_factor_user_id ON public.user_two_factor(user_id);
CREATE INDEX IF NOT EXISTS idx_two_factor_enabled ON public.user_two_factor(is_enabled) WHERE is_enabled = true;

-- Trusted devices indexes
CREATE INDEX IF NOT EXISTS idx_trusted_devices_user_id ON public.user_trusted_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_fingerprint ON public.user_trusted_devices(device_fingerprint);

-- =============================================
-- RLS POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_two_factor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_trusted_devices ENABLE ROW LEVEL SECURITY;

-- Sessions policies
CREATE POLICY "Users can view their own sessions"
ON public.user_sessions FOR SELECT
TO authenticated
USING (auth_id = auth.uid());

CREATE POLICY "Users can revoke their own sessions"
ON public.user_sessions FOR UPDATE
TO authenticated
USING (auth_id = auth.uid())
WITH CHECK (auth_id = auth.uid());

-- Activity log policies
CREATE POLICY "Users can view their own activity"
ON public.user_activity_log FOR SELECT
TO authenticated
USING (auth_id = auth.uid());

-- Login history policies
CREATE POLICY "Users can view their own login history"
ON public.user_login_history FOR SELECT
TO authenticated
USING (auth_id = auth.uid());

-- Verification codes policies (service role only for security)
CREATE POLICY "Service role can manage verification codes"
ON public.user_verification_codes FOR ALL
TO service_role
USING (true);

-- Two-factor policies
CREATE POLICY "Users can manage their own 2FA"
ON public.user_two_factor FOR ALL
TO authenticated
USING (auth_id = auth.uid())
WITH CHECK (auth_id = auth.uid());

-- Trusted devices policies
CREATE POLICY "Users can manage their own trusted devices"
ON public.user_trusted_devices FOR ALL
TO authenticated
USING (auth_id = auth.uid())
WITH CHECK (auth_id = auth.uid());

-- Admin policies for all tables
CREATE POLICY "Admins can view all sessions"
ON public.user_sessions FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all activity"
ON public.user_activity_log FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all login history"
ON public.user_login_history FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to log user activity
CREATE OR REPLACE FUNCTION public.log_user_activity(
    p_user_id BIGINT,
    p_auth_id UUID,
    p_activity_type VARCHAR,
    p_activity_category VARCHAR DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_status VARCHAR DEFAULT 'success'
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_activity_id BIGINT;
BEGIN
    INSERT INTO public.user_activity_log (
        user_id, auth_id, activity_type, activity_category,
        description, metadata, ip_address, user_agent, status
    ) VALUES (
        p_user_id, p_auth_id, p_activity_type, p_activity_category,
        p_description, p_metadata, p_ip_address, p_user_agent, p_status
    ) RETURNING activity_id INTO v_activity_id;
    
    RETURN v_activity_id;
END;
$$;

-- Function to clean expired verification codes
CREATE OR REPLACE FUNCTION public.clean_expired_verification_codes()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM public.user_verification_codes
    WHERE expires_at < NOW() AND is_used = false;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN v_deleted_count;
END;
$$;

-- Function to clean old sessions
CREATE OR REPLACE FUNCTION public.clean_old_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM public.user_sessions
    WHERE (expires_at IS NOT NULL AND expires_at < NOW())
       OR (is_active = false AND last_activity_at < NOW() - INTERVAL '30 days');
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN v_deleted_count;
END;
$$;

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE public.user_sessions IS 'جلسات المستخدمين النشطة والمنتهية';
COMMENT ON TABLE public.user_activity_log IS 'سجل شامل لجميع أنشطة المستخدمين';
COMMENT ON TABLE public.user_login_history IS 'سجل تسجيلات الدخول والخروج';
COMMENT ON TABLE public.user_verification_codes IS 'رموز التحقق للبريد والهاتف';
COMMENT ON TABLE public.user_two_factor IS 'إعدادات المصادقة الثنائية';
COMMENT ON TABLE public.user_trusted_devices IS 'الأجهزة الموثوقة للمستخدمين';
