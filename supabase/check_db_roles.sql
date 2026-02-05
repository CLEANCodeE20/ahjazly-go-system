-- ==========================================================
-- SCRIPT: CHECK EXISTING ROLES & USER TYPES
-- Purpose: View what roles are currently defined in the database
-- ==========================================================

-- 1. جدول الأدوار (Roles Table) - النظام الجديد
-- يعرض الاسم البرمجي والاسم العربي والوصف
SELECT 
    id, 
    name, 
    display_name_ar, 
    level,
    description 
FROM public.roles 
ORDER BY id;

-- 2. أنواع المستخدمين (User Type ENUM) - النظام القديم/الحالي
-- يعرض القيم المتاحة في الـ ENUM
SELECT unnest(enum_range(NULL::public.user_type)) as available_user_types;

-- 3. إحصائية المستخدمين حسب الدور
-- يعرض عدد المستخدمين لكل دور
SELECT 
    r.name as role_name,
    r.display_name_ar,
    COUNT(ur.user_id) as user_count
FROM public.roles r
LEFT JOIN public.user_roles ur ON r.id = ur.role_id
GROUP BY r.id, r.name, r.display_name_ar;
