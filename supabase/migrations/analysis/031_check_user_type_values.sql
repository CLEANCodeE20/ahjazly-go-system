-- ============================================
-- فحص قيم حقل user_type والتوزيع الفعلي
-- ============================================

-- 1. معرفة اسم النوع المخصص للعمود user_type
SELECT udt_name 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'user_type';

-- 2. عرض القيم الفعلية الموجودة في هذا العمود حالياً
SELECT user_type::text, count(*) 
FROM public.users 
GROUP BY 1;
