-- ==========================================================
-- سكريبت التوحيد النهائي للأدوار (النسخة المصححة)
-- حل مشكلة تعارض الأنواع (BigInt vs UUID)
-- ==========================================================

BEGIN;

-- 1. التأكد من وجود كافة المسميات المهنية في النوع (Enum)
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
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'manager') THEN
        ALTER TYPE public.app_role ADD VALUE 'manager';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'accountant') THEN
        ALTER TYPE public.app_role ADD VALUE 'accountant';
    END IF;
END $$;

-- 2. تحويل البيانات في جدول الرتب (user_roles)
-- تصحيح الربط باستخدام جدول users كجسر بين الـ UUID والـ BigInt
UPDATE public.user_roles ur
SET role = COALESCE(
    (
        SELECT e.role_in_company::public.app_role 
        FROM public.employees e 
        JOIN public.users u ON e.user_id = u.user_id 
        WHERE u.id = ur.user_id
    ), 
    'support'::public.app_role
)
WHERE role::text = 'employee' 
   OR role::text = 'PARTNER_EMPLOYEE'; -- شمل كافة مسميات الموظفين القديمة

-- تحويل المسؤولين والشركاء بشكل مباشر
UPDATE public.user_roles SET role = 'SUPERUSER' WHERE role::text = 'admin';
UPDATE public.user_roles SET role = 'PARTNER_ADMIN' WHERE role::text IN ('partner', 'PARTNER_ADMIN');

-- 3. مزامنة البيانات في جدول المستخدمين (users)
-- تحويل مسميات user_type لتتوافق مع الهيكل الجديد
UPDATE public.users SET user_type = 'TRAVELER' WHERE user_type = 'customer';
UPDATE public.users SET user_type = 'SUPERUSER' WHERE user_type IN ('admin', 'SUPERUSER');
UPDATE public.users SET user_type = 'PARTNER_ADMIN' WHERE user_type IN ('partner', 'PARTNER_ADMIN');
-- الموظفين في جدول users يتم تحديثهم لدور الدعم كحالة افتراضية للنظام
UPDATE public.users SET user_type = 'support' WHERE user_type IN ('employee', 'PARTNER_EMPLOYEE');

-- 4. إعداد الصلاحيات للأدوار الجديدة (الـ 48 صلاحية)
INSERT INTO public.role_permissions (role, permission_code)
SELECT 'SUPERUSER', permission_code FROM public.permissions
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission_code)
SELECT 'PARTNER_ADMIN', permission_code FROM public.permissions
ON CONFLICT DO NOTHING;

-- تنظيف الأدوار القديمة المسببة للازدواجية
DELETE FROM public.role_permissions WHERE role IN ('admin', 'partner', 'employee', 'PARTNER_EMPLOYEE');

-- 5. تحديث دالة can_view_data
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
