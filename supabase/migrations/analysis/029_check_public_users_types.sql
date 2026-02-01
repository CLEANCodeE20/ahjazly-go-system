-- ============================================
-- فحص أعمدة جدول المستخدمين (public.users)
-- ============================================

-- 1. عرض هيكل جدول المستخدمين للبحث عن حقول النوع أو الدور
SELECT 
    column_name, 
    data_type
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public';

-- 2. عرض عينة من قيم النوع (إذا وجدت) للتأكد من المسميات
-- سأفترض وجود عمود باسم 'role' أو 'user_type' بناءً على الأنماط الشائعة
SELECT 
    COALESCE(role::text, 'no_role_col') as role_col_val,
    count(*)
FROM public.users
GROUP BY 1;
