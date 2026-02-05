-- ==========================================================
-- SCRIPT: NORMALIZE USER ROLES (HANDLE DEPENDENCIES)
-- Purpose: Drop views, Fix types, Update data, Restore views
-- ==========================================================

BEGIN;

-- 1. حذف الـ VIEWS المرتبطة مؤقتاً (لأنها تمنع تعديل العمود)
DROP VIEW IF EXISTS public.vw_user_redirection;
-- أضف هنا أي views أخرى قد تظهر في الأخطاء لاحقاً

-- 2. تحويل العمود لنص (الآن المفروض ينجح بعد حذف الـ View)
ALTER TABLE public.user_roles ALTER COLUMN role TYPE TEXT;

-- 3. تحديث القيم
UPDATE public.user_roles SET role = 'SUPERUSER' WHERE role = 'admin';
UPDATE public.user_roles SET role = 'PARTNER_ADMIN' WHERE role = 'partner';
UPDATE public.user_roles SET role = 'DRIVER' WHERE role = 'driver';
UPDATE public.user_roles SET role = 'PARTNER_EMPLOYEE' WHERE role = 'employee';
UPDATE public.user_roles SET role = 'AGENT' WHERE role = 'agent';
UPDATE public.user_roles SET role = 'CUSTOMER_SUPPORT' WHERE role = 'support';
UPDATE public.user_roles SET role = 'TRAVELER' WHERE role = 'customer';
-- تحديث أي قيم أخرى متبقية
UPDATE public.user_roles SET role = UPPER(role) WHERE role ~ '^[a-z]+$';

-- 4. تحديث role_id
UPDATE public.user_roles ur
SET role_id = r.id
FROM public.roles r
WHERE ur.role = r.name
AND (ur.role_id IS NULL OR ur.role_id != r.id);

-- 5. إعادة بناء الـ VIEW التي حذفناها (بناءً على الكود الجديد المتوقع)
CREATE OR REPLACE VIEW public.vw_user_redirection AS
SELECT 
    ur.auth_id,
    ur.role,
    CASE 
        WHEN ur.role = 'SUPERUSER' THEN '/admin'
        WHEN ur.role = 'PARTNER_ADMIN' THEN '/dashboard'
        WHEN ur.role = 'DRIVER' THEN '/driver-app'
        ELSE '/' 
    END AS redirect_path
FROM public.user_roles ur;

COMMIT;
