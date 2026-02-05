-- =============================================
-- إضافة قيود على جدول الشركات (partners)
-- =============================================

-- 1. إضافة قيد UNIQUE على السجل التجاري
ALTER TABLE public.partners 
ADD CONSTRAINT partners_commercial_registration_unique 
UNIQUE (commercial_registration);

-- 2. إضافة قيد UNIQUE على الرقم الضريبي
ALTER TABLE public.partners 
ADD CONSTRAINT partners_tax_number_unique 
UNIQUE (tax_number);

-- 3. إضافة حقول الاتصال (إن لم تكن موجودة)
DO $$ 
BEGIN
    -- إضافة contact_phone إن لم يكن موجوداً
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'partners' AND column_name = 'contact_phone'
    ) THEN
        ALTER TABLE public.partners ADD COLUMN contact_phone VARCHAR(20);
    END IF;

    -- إضافة contact_email إن لم يكن موجوداً
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'partners' AND column_name = 'contact_email'
    ) THEN
        ALTER TABLE public.partners ADD COLUMN contact_email VARCHAR(255);
    END IF;

    -- إضافة city إن لم يكن موجوداً
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'partners' AND column_name = 'city'
    ) THEN
        ALTER TABLE public.partners ADD COLUMN city VARCHAR(100);
    END IF;

    -- إضافة description إن لم يكن موجوداً
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'partners' AND column_name = 'description'
    ) THEN
        ALTER TABLE public.partners ADD COLUMN description TEXT;
    END IF;

    -- إضافة updated_at إن لم يكن موجوداً
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'partners' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.partners ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
    END IF;
END $$;

-- 4. إضافة قيد UNIQUE على contact_email
ALTER TABLE public.partners 
ADD CONSTRAINT partners_contact_email_unique 
UNIQUE (contact_email);

-- 5. إنشاء trigger لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_partners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. ربط الـ trigger بالجدول
DROP TRIGGER IF EXISTS partners_updated_at_trigger ON public.partners;
CREATE TRIGGER partners_updated_at_trigger
    BEFORE UPDATE ON public.partners
    FOR EACH ROW
    EXECUTE FUNCTION update_partners_updated_at();

-- 7. إضافة قيود التحقق (اختياري)
-- التحقق من صيغة IBAN السعودي
ALTER TABLE public.partners 
ADD CONSTRAINT partners_iban_format_check 
CHECK (iban IS NULL OR iban ~* '^SA[0-9]{22}$');

-- التحقق من صيغة الرقم الضريبي السعودي (15 رقم)
ALTER TABLE public.partners 
ADD CONSTRAINT partners_tax_number_format_check 
CHECK (tax_number IS NULL OR tax_number ~* '^[0-9]{15}$');

-- 8. عرض النتيجة
SELECT 
    'تم إضافة القيود بنجاح!' AS message,
    COUNT(*) AS total_partners
FROM public.partners;
