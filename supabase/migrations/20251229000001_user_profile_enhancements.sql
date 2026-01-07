-- =============================================
-- User Profile Enhancements Migration
-- تحسينات الملف الشخصي للمستخدم
-- =============================================

-- 1. Add new columns to users table
-- إضافة أعمدة جديدة لجدول المستخدمين

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS nationality VARCHAR(50);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS id_number VARCHAR(50);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS profile_completion_percentage INTEGER DEFAULT 0;

-- 2. Add indexes for performance
-- إضافة فهارس لتحسين الأداء

CREATE INDEX IF NOT EXISTS idx_users_email_verified ON public.users(email_verified);
CREATE INDEX IF NOT EXISTS idx_users_phone_verified ON public.users(phone_verified);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON public.users(last_login_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_last_activity ON public.users(last_activity_at DESC);

-- 3. Create function to calculate profile completion
-- دالة لحساب نسبة اكتمال الملف الشخصي

CREATE OR REPLACE FUNCTION public.calculate_profile_completion(user_record public.users)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    total_fields INTEGER := 12;
    completed_fields INTEGER := 0;
BEGIN
    -- Required fields
    IF user_record.full_name IS NOT NULL AND user_record.full_name != '' THEN
        completed_fields := completed_fields + 1;
    END IF;
    
    IF user_record.email IS NOT NULL AND user_record.email != '' THEN
        completed_fields := completed_fields + 1;
    END IF;
    
    IF user_record.phone_number IS NOT NULL AND user_record.phone_number != '' THEN
        completed_fields := completed_fields + 1;
    END IF;
    
    -- Optional but important fields
    IF user_record.avatar_url IS NOT NULL THEN
        completed_fields := completed_fields + 1;
    END IF;
    
    IF user_record.bio IS NOT NULL AND user_record.bio != '' THEN
        completed_fields := completed_fields + 1;
    END IF;
    
    IF user_record.date_of_birth IS NOT NULL THEN
        completed_fields := completed_fields + 1;
    END IF;
    
    IF user_record.nationality IS NOT NULL THEN
        completed_fields := completed_fields + 1;
    END IF;
    
    IF user_record.id_number IS NOT NULL THEN
        completed_fields := completed_fields + 1;
    END IF;
    
    IF user_record.gender IS NOT NULL THEN
        completed_fields := completed_fields + 1;
    END IF;
    
    -- Verification status
    IF user_record.email_verified = true THEN
        completed_fields := completed_fields + 1;
    END IF;
    
    IF user_record.phone_verified = true THEN
        completed_fields := completed_fields + 1;
    END IF;
    
    IF user_record.onboarding_completed = true THEN
        completed_fields := completed_fields + 1;
    END IF;
    
    RETURN (completed_fields * 100 / total_fields);
END;
$$;

-- 4. Create trigger to auto-update profile completion
-- محفز لتحديث نسبة الاكتمال تلقائياً

CREATE OR REPLACE FUNCTION public.update_profile_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.profile_completion_percentage := public.calculate_profile_completion(NEW);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_profile_completion ON public.users;
CREATE TRIGGER trigger_update_profile_completion
    BEFORE INSERT OR UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_profile_completion();

-- 5. Update existing users' profile completion
-- تحديث نسبة الاكتمال للمستخدمين الحاليين

UPDATE public.users
SET profile_completion_percentage = public.calculate_profile_completion(users.*);

-- 6. Add comments for documentation
-- إضافة تعليقات للتوثيق

COMMENT ON COLUMN public.users.avatar_url IS 'URL للصورة الشخصية للمستخدم';
COMMENT ON COLUMN public.users.bio IS 'السيرة الذاتية أو الوصف الشخصي';
COMMENT ON COLUMN public.users.date_of_birth IS 'تاريخ الميلاد';
COMMENT ON COLUMN public.users.nationality IS 'الجنسية';
COMMENT ON COLUMN public.users.id_number IS 'رقم الهوية الوطنية';
COMMENT ON COLUMN public.users.email_verified IS 'حالة التحقق من البريد الإلكتروني';
COMMENT ON COLUMN public.users.phone_verified IS 'حالة التحقق من رقم الهاتف';
COMMENT ON COLUMN public.users.preferences IS 'تفضيلات المستخدم (JSON)';
COMMENT ON COLUMN public.users.last_login_at IS 'آخر وقت لتسجيل الدخول';
COMMENT ON COLUMN public.users.last_activity_at IS 'آخر نشاط للمستخدم';
COMMENT ON COLUMN public.users.onboarding_completed IS 'حالة إكمال عملية الإعداد الأولي';
COMMENT ON COLUMN public.users.profile_completion_percentage IS 'نسبة اكتمال الملف الشخصي (0-100)';
