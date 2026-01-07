-- =============================================
-- STORAGE BUCKETS CONFIGURATION
-- تهيئة حاويات التخزين للصور والمستندات
-- =============================================

-- 1. حاوية أصول التطبيق (السلايدر، الأيقونات، إلخ)
INSERT INTO storage.buckets (id, name, public)
VALUES ('app-assets', 'app-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. حاوية صور الهوية للمسافرين
INSERT INTO storage.buckets (id, name, public)
VALUES ('id-images', 'id-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. حاوية شعارات الشركاء
INSERT INTO storage.buckets (id, name, public)
VALUES ('partner-logos', 'partner-logos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- =============================================
-- STORAGE POLICIES (سياسات الأمان)
-- =============================================

-- سياسة المشاهدة للجميع (Public Read)
CREATE POLICY "Public Access for App Assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'app-assets');

CREATE POLICY "Public Access for ID Images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'id-images');

CREATE POLICY "Public Access for Partner Logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'partner-logos');

-- سياسة الإدارة للمسؤولين فقط (Admin Full Access)
CREATE POLICY "Admins can manage app assets"
ON storage.objects FOR ALL
TO authenticated
USING (
    bucket_id = 'app-assets' AND 
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE auth_id = auth.uid() 
        AND user_type = 'admin'
    )
);

CREATE POLICY "Admins can manage ID images"
ON storage.objects FOR ALL
TO authenticated
USING (
    bucket_id = 'id-images' AND 
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE auth_id = auth.uid() 
        AND user_type = 'admin'
    )
);

CREATE POLICY "Admins can manage partner logos"
ON storage.objects FOR ALL
TO authenticated
USING (
    bucket_id = 'partner-logos' AND 
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE auth_id = auth.uid() 
        AND user_type = 'admin'
    )
);

-- سياسة الرفع للمستخدمين العاديين (لحساب صور الهوية عند الحجز)
-- ملاحظة: هذه السياسة تسمح بالرفع فقط، لا الحذف أو التعديل
CREATE POLICY "authenticated can upload ID images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'id-images');
