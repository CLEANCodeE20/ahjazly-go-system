-- ==========================================================
-- التوحيد النهائي والشامل للأدوار (Final Role Unification)
-- مسج كل آثار الأدوار القديمة والاعتماد الحصري على النظام المطور
-- ==========================================================

BEGIN;

-- 1. ترقية نوع الـ ENUM لضمان دعم كافة المسميات (إذا لم تكن موجودة)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'SUPERUSER') THEN
        ALTER TYPE public.app_role ADD VALUE 'SUPERUSER';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'PARTNER_ADMIN') THEN
        ALTER TYPE public.app_role ADD VALUE 'PARTNER_ADMIN';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'support') THEN
        ALTER TYPE public.app_role ADD VALUE 'support';
    END IF;
END $$;

-- 2. تحويل البيانات في جدول user_roles (نقطة الاتصال المركزية)
-- تحويل admin -> SUPERUSER
UPDATE public.user_roles SET role = 'SUPERUSER' WHERE role::text = 'admin';
-- تحويل partner -> PARTNER_ADMIN
UPDATE public.user_roles SET role = 'PARTNER_ADMIN' WHERE role::text = 'partner';
-- تحويل employee -> support (أو الدور المسجل في جدول الموظفين)
UPDATE public.user_roles ur
SET role = COALESCE(
    (SELECT role_in_company::public.app_role FROM public.employees e WHERE e.user_id = ur.user_id),
    'support'::public.app_role
)
WHERE role::text = 'employee';

-- 3. تحويل البيانات في جداول الموظفين والعملاء (Sync)
UPDATE public.users SET user_type = 'TRAVELER' WHERE user_type = 'customer';
UPDATE public.users SET user_type = 'SUPERUSER' WHERE user_type = 'admin';
UPDATE public.users SET user_type = 'PARTNER_ADMIN' WHERE user_type = 'partner';
UPDATE public.users SET user_type = 'support' WHERE user_type = 'employee';

-- 4. تنظيف وتوحيد جدول الصلاحيات (role_permissions)
-- نقل صلاحيات admin إلى SUPERUSER
INSERT INTO public.role_permissions (role, permission_code)
SELECT 'SUPERUSER', permission_code FROM public.permissions
ON CONFLICT DO NOTHING;

-- نقل صلاحيات partner إلى PARTNER_ADMIN
INSERT INTO public.role_permissions (role, permission_code)
SELECT 'PARTNER_ADMIN', permission_code FROM public.permissions
ON CONFLICT DO NOTHING;

-- مسح الأدوار القديمة من جدول الصلاحيات نهائياً
DELETE FROM public.role_permissions WHERE role IN ('admin', 'partner', 'employee');

-- 5. تحديث دالة can_view_data للاعتماد الحصري على الأدوار الجديدة
CREATE OR REPLACE FUNCTION public.can_view_data(_row_partner_id BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _user_id UUID := auth.uid();
    _role TEXT;
    _user_partner_id INTEGER;
BEGIN
    IF _user_id IS NULL THEN RETURN TRUE; END IF;

    SELECT role::text, partner_id INTO _role, _user_partner_id 
    FROM public.user_roles 
    WHERE user_id = _user_id 
    LIMIT 1;

    IF _role IS NULL OR _role = 'TRAVELER' THEN RETURN TRUE; END IF;
    IF _role = 'SUPERUSER' THEN RETURN TRUE; END IF;

    RETURN (_row_partner_id = _user_partner_id) OR (_row_partner_id IS NULL);
END;
$$;

COMMIT;
