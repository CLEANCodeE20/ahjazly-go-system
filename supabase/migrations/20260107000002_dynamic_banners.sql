-- =============================================
-- DYNAMIC BANNER SLIDER TABLE
-- جدول السلايدر الإعلاني الديناميكي
-- =============================================

CREATE TABLE public.banners (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255),
    image_url TEXT NOT NULL,
    target_url TEXT, -- الرابط الذي يفتح عند الضغط
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- السياسات
CREATE POLICY "الكل يمكنه رؤية الإعلانات النشطة" 
ON public.banners FOR SELECT 
USING (is_active = true);

-- سياسة للمسؤولين فقط للتحكم الكامل
CREATE POLICY "المسؤولين لديهم صلاحيات كاملة على الإعلانات" 
ON public.banners FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = auth.uid() 
    AND user_type = 'admin'
  )
);

-- Trigger لتحديث updated_at
CREATE TRIGGER update_banners_updated_at
    BEFORE UPDATE ON public.banners
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.banners IS 'جدول تخزين بيانات السلايدر الإعلاني المتحرك في التطبيق';
