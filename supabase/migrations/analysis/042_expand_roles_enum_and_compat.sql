-- ترقية نظام الأدوار ودعم المسميات القديمة والجديدة
-- 1. توسيع النوع ENUM ليشمل الأدوار المهنية
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'accountant';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'support';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'supervisor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'driver';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'assistant';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'SUPERUSER';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'PARTNER_ADMIN';

-- 2. ضمان أن الأدوار القديمة تمتلك صلاحيات أساسية (Compatibility Layer)
-- ربط 'employee' بصلاحيات 'support' بشكل مؤقت لضمان عدم التوقف
INSERT INTO public.role_permissions (role, permission_code)
SELECT 'employee', permission_code 
FROM public.role_permissions 
WHERE role = 'support'
ON CONFLICT DO NOTHING;

-- ربط 'admin' القديم بكافة الصلاحيات (مثل SUPERUSER)
INSERT INTO public.role_permissions (role, permission_code)
SELECT 'admin', permission_code FROM public.permissions
ON CONFLICT DO NOTHING;

-- ربط 'partner' القديم بكافة الصلاحيات (مثل PARTNER_ADMIN)
INSERT INTO public.role_permissions (role, permission_code)
SELECT 'partner', permission_code FROM public.permissions
ON CONFLICT DO NOTHING;

COMMIT;
