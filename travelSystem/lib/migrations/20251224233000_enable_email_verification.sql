-- Enable Email Verification Settings
-- This migration configures email verification for new user signups

-- Note: Some of these settings need to be configured in Supabase Dashboard
-- This migration documents the recommended settings

-- 1. Update system config to enable email verification
UPDATE public.system_config 
SET value = 'true'::jsonb
WHERE key = 'enable_email_verification';

-- 2. Add email verification redirect URL to config
INSERT INTO public.system_config (key, value, description, category, is_public) VALUES
('email_verification_redirect_url', '"https://yourdomain.com/verify-email"'::jsonb, 'URL to redirect after email verification', 'authentication', false)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 3. Create a function to check if user email is verified
CREATE OR REPLACE FUNCTION public.is_email_verified(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email_confirmed_at IS NOT NULL
  FROM auth.users
  WHERE id = user_id;
$$;

-- 4. Add email_verified column to users table for caching (optional)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- 5. Create trigger to update email_verified status
CREATE OR REPLACE FUNCTION public.sync_email_verified()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET email_verified = (NEW.email_confirmed_at IS NOT NULL)
  WHERE auth_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Attach trigger to auth.users
DROP TRIGGER IF EXISTS trigger_sync_email_verified ON auth.users;
CREATE TRIGGER trigger_sync_email_verified
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_email_verified();

-- 7. Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_email_verified(UUID) TO authenticated;

-- 8. Add helpful comments
COMMENT ON FUNCTION public.is_email_verified(UUID) IS 
'Check if a user has verified their email address';

COMMENT ON COLUMN public.users.email_verified IS 
'Cached email verification status from auth.users';

-- ==========================================
-- MANUAL CONFIGURATION REQUIRED IN SUPABASE DASHBOARD
-- ==========================================

-- Go to: Authentication > Settings > Email Auth
-- 
-- 1. Enable "Confirm email" checkbox
-- 2. Set "Confirm email redirect URL" to: https://yourdomain.com/verify-email
-- 3. Customize email templates if needed
--
-- Email Template Variables:
-- - {{ .ConfirmationURL }} - The verification link
-- - {{ .Token }} - The verification token
-- - {{ .Email }} - User's email address
-- - {{ .SiteURL }} - Your site URL
--
-- ==========================================
