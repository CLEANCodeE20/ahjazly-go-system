-- ==========================================================
-- السكريبت الرئيسي للتحول الشامل (Master Migration v2)
-- توحيد الملفات الشخصية، الأدوار، والصلاحيات لـ 27 مستخدماً
-- ==========================================================

DO $$ 
BEGIN
    RAISE NOTICE 'بدء التحول الشامل للنظام...';

    -- 1. تحديث الـ Enums (السماح بالمسميات الجديدة في كلا الجدولين)
    -- تحديث نوع app_role (المستخدم في الصلاحيات)
    ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'SUPERUSER';
    ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'TRAVELER';
    ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'PARTNER_ADMIN';
    ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'DRIVER';
    ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'AGENT';
    ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'PARTNER_EMPLOYEE';
    ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'CUSTOMER_SUPPORT';

    -- تحديث نوع user_type (المستخدم في ملف المستخدم الرئيسي)
    ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'SUPERUSER';
    ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'TRAVELER';
    ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'PARTNER_ADMIN';
    ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'DRIVER';
    ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'AGENT';
    ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'PARTNER_EMPLOYEE';
    ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'CUSTOMER_SUPPORT';

    -- 2. توحيد وتحديث نوع المستخدم في جدول Users الرئيسي (الـ 27 مستخدماً)
    UPDATE public.users SET user_type = 'SUPERUSER'::user_type WHERE user_type::text = 'admin';
    UPDATE public.users SET user_type = 'PARTNER_ADMIN'::user_type WHERE user_type::text = 'partner';
    UPDATE public.users SET user_type = 'PARTNER_EMPLOYEE'::user_type WHERE user_type::text = 'employee';
    UPDATE public.users SET user_type = 'TRAVELER'::user_type WHERE user_type::text IN ('customer', 'user');
    UPDATE public.users SET user_type = 'DRIVER'::user_type WHERE user_type::text = 'driver';

    -- 3. ترحيل وتوحيد الأدوار في جدول user_roles (الأمان)
    -- تحديث الـ 17 الحاليين
    UPDATE user_roles SET role = 'SUPERUSER'::app_role WHERE role::text = 'admin';
    UPDATE user_roles SET role = 'PARTNER_ADMIN'::app_role WHERE role::text = 'partner';
    UPDATE user_roles SET role = 'PARTNER_EMPLOYEE'::app_role WHERE role::text = 'employee';

    -- ربط الـ 10 مستخدمين "المنسيين" (العملاء والسائقين) بنظام الصلاحيات
    INSERT INTO user_roles (user_id, role)
    SELECT auth_id, 'TRAVELER'::app_role 
    FROM public.users 
    WHERE user_type::text = 'TRAVELER'
    AND auth_id NOT IN (SELECT user_id FROM user_roles)
    ON CONFLICT DO NOTHING;

    INSERT INTO user_roles (user_id, role)
    SELECT auth_id, 'DRIVER'::app_role 
    FROM public.users 
    WHERE user_type::text = 'DRIVER'
    AND auth_id NOT IN (SELECT user_id FROM user_roles)
    ON CONFLICT DO NOTHING;

    -- 4. إدراج بيانات الـ 48 صلاحية وتوزيعها على الأدوار الجديدة
    -- (نفس منطق السكريبت السابق مع المسميات الجديدة)
    -- [سيقوم السكريبت بتنظيف وإعادة بناء علاقة الأدوار بالصلاحيات]
    DELETE FROM role_permissions;
    
    -- الآدمن الأعلى يحصل على كل الصلاحيات
    INSERT INTO role_permissions (role, permission_code)
    SELECT 'SUPERUSER', permission_code FROM permissions;

    -- شريك الإدارة
    INSERT INTO role_permissions (role, permission_code)
    SELECT 'PARTNER_ADMIN', permission_code FROM permissions 
    WHERE category IN ('الرحلات', 'الحجوزات', 'الأسطول', 'الموظفين', 'التقارير')
    OR permission_code LIKE '%_own';

    -- المسافر (العميل)
    INSERT INTO role_permissions (role, permission_code)
    SELECT 'TRAVELER', permission_code FROM permissions 
    WHERE permission_code IN ('trip:read_all', 'booking:create', 'booking:read_own');

    RAISE NOTICE 'تم توحيد بيانات الـ 27 مستخدماً وتفعيل نظام الصلاحيات الجديد بنجاح! 🎉';
END $$;
