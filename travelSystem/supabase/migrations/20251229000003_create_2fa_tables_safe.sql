-- Safe migration for 2FA tables with existence checks
-- Created: 2025-12-29

-- 1. Create user_two_factor table if not exists
CREATE TABLE IF NOT EXISTS public.user_two_factor (
    two_factor_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(user_id) ON DELETE CASCADE,
    auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    method VARCHAR(50) NOT NULL DEFAULT 'totp',
    secret_key TEXT,
    backup_codes JSONB DEFAULT '[]'::jsonb,
    is_enabled BOOLEAN DEFAULT false,
    enabled_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create user_verification_codes table if not exists
CREATE TABLE IF NOT EXISTS public.user_verification_codes (
    verification_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(user_id) ON DELETE CASCADE,
    auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    code VARCHAR(10) NOT NULL,
    verification_type VARCHAR(20) NOT NULL CHECK (verification_type IN ('email', 'phone')),
    contact_info TEXT NOT NULL,
    is_used BOOLEAN DEFAULT false,
    used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes if not exists
CREATE INDEX IF NOT EXISTS idx_user_two_factor_auth_id ON public.user_two_factor(auth_id);
CREATE INDEX IF NOT EXISTS idx_user_two_factor_user_id ON public.user_two_factor(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_codes_auth_id ON public.user_verification_codes(auth_id);
CREATE INDEX IF NOT EXISTS idx_verification_codes_code ON public.user_verification_codes(code);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires ON public.user_verification_codes(expires_at);

-- 4. Enable RLS
ALTER TABLE public.user_two_factor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_verification_codes ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies if they exist (to recreate them)
DROP POLICY IF EXISTS "Users can view own 2FA settings" ON public.user_two_factor;
DROP POLICY IF EXISTS "Users can update own 2FA settings" ON public.user_two_factor;
DROP POLICY IF EXISTS "Admins can manage all 2FA" ON public.user_two_factor;
DROP POLICY IF EXISTS "Users can view own verification codes" ON public.user_verification_codes;
DROP POLICY IF EXISTS "Service role can manage verification codes" ON public.user_verification_codes;

-- 6. Create policies for user_two_factor
CREATE POLICY "Users can view own 2FA settings"
    ON public.user_two_factor
    FOR SELECT
    USING (auth.uid() = auth_id);

CREATE POLICY "Users can update own 2FA settings"
    ON public.user_two_factor
    FOR ALL
    USING (auth.uid() = auth_id);

CREATE POLICY "Admins can manage all 2FA"
    ON public.user_two_factor
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 
            FROM public.user_roles ur
            -- user_roles.user_id is UUID (auth_id) based on the error history
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'admin'
        )
    );

-- 7. Create policies for user_verification_codes
CREATE POLICY "Users can view own verification codes"
    ON public.user_verification_codes
    FOR SELECT
    USING (auth.uid() = auth_id);

CREATE POLICY "Service role can manage verification codes"
    ON public.user_verification_codes
    FOR ALL
    USING (true);

-- 8. Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_user_two_factor_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_two_factor_updated_at ON public.user_two_factor;
CREATE TRIGGER trigger_update_user_two_factor_updated_at
    BEFORE UPDATE ON public.user_two_factor
    FOR EACH ROW
    EXECUTE FUNCTION update_user_two_factor_updated_at();

-- 9. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_two_factor TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_verification_codes TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE user_two_factor_two_factor_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE user_verification_codes_verification_id_seq TO authenticated;

-- 10. Add helpful comments
COMMENT ON TABLE public.user_two_factor IS 'Stores two-factor authentication settings for users';
COMMENT ON TABLE public.user_verification_codes IS 'Stores temporary verification codes for email/phone verification';
COMMENT ON COLUMN public.user_two_factor.backup_codes IS 'JSON array of backup codes for account recovery';
COMMENT ON COLUMN public.user_verification_codes.verification_type IS 'Type of verification: email or phone';
