-- =============================================
-- COMPREHENSIVE TRIP RATING SYSTEM
-- نظام التقييم المتكامل للرحلات
-- =============================================

-- =============================================
-- PART 1: ENHANCE RATINGS TABLE
-- تحسين جدول التقييمات الحالي
-- =============================================

-- Add new columns to existing ratings table
ALTER TABLE public.ratings 
ADD COLUMN IF NOT EXISTS booking_id BIGINT REFERENCES public.bookings(booking_id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS service_rating INTEGER CHECK (service_rating >= 1 AND service_rating <= 5),
ADD COLUMN IF NOT EXISTS cleanliness_rating INTEGER CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
ADD COLUMN IF NOT EXISTS punctuality_rating INTEGER CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
ADD COLUMN IF NOT EXISTS comfort_rating INTEGER CHECK (comfort_rating >= 1 AND comfort_rating <= 5),
ADD COLUMN IF NOT EXISTS value_for_money_rating INTEGER CHECK (value_for_money_rating >= 1 AND value_for_money_rating <= 5),
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS not_helpful_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reported_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_ratings_booking_id ON public.ratings(booking_id);
CREATE INDEX IF NOT EXISTS idx_ratings_partner_id ON public.ratings(partner_id);
CREATE INDEX IF NOT EXISTS idx_ratings_driver_id ON public.ratings(driver_id);
CREATE INDEX IF NOT EXISTS idx_ratings_visible ON public.ratings(is_visible) WHERE is_visible = true;
CREATE INDEX IF NOT EXISTS idx_ratings_stars ON public.ratings(stars);

-- Add unique constraint to ensure one rating per booking
ALTER TABLE public.ratings 
ADD CONSTRAINT unique_rating_per_booking UNIQUE (booking_id);

COMMENT ON COLUMN public.ratings.booking_id IS 'ربط التقييم بالحجز لضمان أن المستخدم سافر فعلاً';
COMMENT ON COLUMN public.ratings.is_verified IS 'تأكيد أن التقييم من راكب فعلي قام بالرحلة';
COMMENT ON COLUMN public.ratings.is_visible IS 'إمكانية إخفاء التقييمات غير المناسبة من قبل الإدارة';
COMMENT ON COLUMN public.ratings.helpful_count IS 'عدد المستخدمين الذين وجدوا التقييم مفيداً';

-- =============================================
-- PART 2: PARTNER RESPONSES TABLE
-- جدول ردود الشركاء على التقييمات
-- =============================================

CREATE TABLE IF NOT EXISTS public.rating_responses (
    response_id BIGSERIAL PRIMARY KEY,
    rating_id BIGINT NOT NULL REFERENCES public.ratings(rating_id) ON DELETE CASCADE,
    partner_id BIGINT NOT NULL REFERENCES public.partners(partner_id) ON DELETE CASCADE,
    responder_user_id BIGINT REFERENCES public.users(user_id),
    response_text TEXT NOT NULL,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rating_responses_rating_id ON public.rating_responses(rating_id);
CREATE INDEX IF NOT EXISTS idx_rating_responses_partner_id ON public.rating_responses(partner_id);

COMMENT ON TABLE public.rating_responses IS 'ردود الشركاء على التقييمات المستلمة';

-- =============================================
-- PART 3: RATING HELPFULNESS TABLE
-- جدول تقييم مدى فائدة التقييمات
-- =============================================

CREATE TABLE IF NOT EXISTS public.rating_helpfulness (
    id BIGSERIAL PRIMARY KEY,
    rating_id BIGINT NOT NULL REFERENCES public.ratings(rating_id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    is_helpful BOOLEAN NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(rating_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_rating_helpfulness_rating_id ON public.rating_helpfulness(rating_id);
CREATE INDEX IF NOT EXISTS idx_rating_helpfulness_user_id ON public.rating_helpfulness(user_id);

COMMENT ON TABLE public.rating_helpfulness IS 'تقييم المستخدمين لمدى فائدة التقييمات';

-- =============================================
-- PART 4: RATING REPORTS TABLE
-- جدول البلاغات عن التقييمات غير المناسبة
-- =============================================

CREATE TABLE IF NOT EXISTS public.rating_reports (
    report_id BIGSERIAL PRIMARY KEY,
    rating_id BIGINT NOT NULL REFERENCES public.ratings(rating_id) ON DELETE CASCADE,
    reporter_user_id BIGINT NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    reason VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    reviewed_by BIGINT REFERENCES public.users(user_id),
    reviewed_at TIMESTAMP,
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rating_reports_rating_id ON public.rating_reports(rating_id);
CREATE INDEX IF NOT EXISTS idx_rating_reports_status ON public.rating_reports(status);

COMMENT ON TABLE public.rating_reports IS 'البلاغات عن التقييمات غير المناسبة أو المسيئة';

-- =============================================
-- PART 5: ENABLE RLS
-- تمكين أمان مستوى الصف
-- =============================================

ALTER TABLE public.rating_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rating_helpfulness ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rating_reports ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PART 6: TRIGGERS
-- المحفزات
-- =============================================

-- Trigger to update updated_at on ratings
CREATE OR REPLACE FUNCTION public.update_rating_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ratings_updated_at
    BEFORE UPDATE ON public.ratings
    FOR EACH ROW EXECUTE FUNCTION public.update_rating_updated_at();

-- Trigger to update updated_at on rating_responses
CREATE TRIGGER update_rating_responses_updated_at
    BEFORE UPDATE ON public.rating_responses
    FOR EACH ROW EXECUTE FUNCTION public.update_rating_updated_at();

-- Trigger to update helpful_count when helpfulness is added/updated
CREATE OR REPLACE FUNCTION public.update_rating_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.is_helpful THEN
            UPDATE public.ratings 
            SET helpful_count = helpful_count + 1 
            WHERE rating_id = NEW.rating_id;
        ELSE
            UPDATE public.ratings 
            SET not_helpful_count = not_helpful_count + 1 
            WHERE rating_id = NEW.rating_id;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.is_helpful != NEW.is_helpful THEN
            IF NEW.is_helpful THEN
                UPDATE public.ratings 
                SET helpful_count = helpful_count + 1,
                    not_helpful_count = not_helpful_count - 1
                WHERE rating_id = NEW.rating_id;
            ELSE
                UPDATE public.ratings 
                SET helpful_count = helpful_count - 1,
                    not_helpful_count = not_helpful_count + 1
                WHERE rating_id = NEW.rating_id;
            END IF;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.is_helpful THEN
            UPDATE public.ratings 
            SET helpful_count = helpful_count - 1 
            WHERE rating_id = OLD.rating_id;
        ELSE
            UPDATE public.ratings 
            SET not_helpful_count = not_helpful_count - 1 
            WHERE rating_id = OLD.rating_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_helpful_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.rating_helpfulness
    FOR EACH ROW EXECUTE FUNCTION public.update_rating_helpful_count();

-- Trigger to update reported_count when report is added
CREATE OR REPLACE FUNCTION public.update_rating_reported_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.ratings 
        SET reported_count = reported_count + 1 
        WHERE rating_id = NEW.rating_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.ratings 
        SET reported_count = reported_count - 1 
        WHERE rating_id = OLD.rating_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reported_count_trigger
    AFTER INSERT OR DELETE ON public.rating_reports
    FOR EACH ROW EXECUTE FUNCTION public.update_rating_reported_count();

-- Trigger to verify rating when booking is completed
CREATE OR REPLACE FUNCTION public.verify_rating_on_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_booking_status booking_status;
    v_trip_status trip_status;
BEGIN
    -- Check if booking and trip are completed
    SELECT b.booking_status, t.status
    INTO v_booking_status, v_trip_status
    FROM bookings b
    JOIN trips t ON b.trip_id = t.trip_id
    WHERE b.booking_id = NEW.booking_id;
    
    -- Auto-verify if booking and trip are completed
    IF v_booking_status = 'completed' AND v_trip_status = 'completed' THEN
        NEW.is_verified = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER verify_rating_trigger
    BEFORE INSERT ON public.ratings
    FOR EACH ROW EXECUTE FUNCTION public.verify_rating_on_insert();
