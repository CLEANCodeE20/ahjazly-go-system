-- =============================================
-- DYNAMIC CITY MANAGEMENT SYSTEM
-- نظام إدارة المدن الديناميكي
-- =============================================

-- 1. Create cities table
CREATE TABLE IF NOT EXISTS public.cities (
    city_id BIGSERIAL PRIMARY KEY,
    name_ar TEXT NOT NULL UNIQUE,
    name_en TEXT,
    is_active BOOLEAN DEFAULT true,
    country_code TEXT DEFAULT 'YE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('UTC'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('UTC'::text, NOW())
);

-- 2. Enable RLS
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
DROP POLICY IF EXISTS "Anyone can view active cities" ON public.cities;
CREATE POLICY "Anyone can view active cities" 
ON public.cities FOR SELECT 
TO anon, authenticated 
USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage cities" ON public.cities;
CREATE POLICY "Admins can manage cities" 
ON public.cities FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- 4. Seed initial cities from AppConstants
INSERT INTO public.cities (name_ar, name_en)
VALUES 
    ('صنعاء', 'Sanaa'),
    ('عدن', 'Aden'),
    ('تعز', 'Taiz'),
    ('الحديدة', 'Hodeidah'),
    ('إب', 'Ibb'),
    ('الرياض', 'Riyadh'),
    ('مكه', 'Mecca')
ON CONFLICT (name_ar) DO NOTHING;

-- 5. Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_cities_updated_at ON public.cities;
CREATE TRIGGER tr_cities_updated_at
    BEFORE UPDATE ON public.cities
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

COMMENT ON TABLE public.cities IS 'قائمة المدن المعتمدة في النظام للمنطلق والوجهة';
