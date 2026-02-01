-- ==========================================================
-- المرحلة 2: تحديث المستخدمين والصلاحيات (الترقية النهائية)
-- جشّلها بعد نجاح المرحلة 1
-- ==========================================================

DO $$ 
BEGIN
    -- 1. إنشاء جدول الأدوار وتسجيل البيانات
    CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        display_name_ar TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    INSERT INTO roles (id, name, display_name_ar) VALUES
    (1, 'SUPERUSER', 'المشرف الأعلى'),
    (2, 'TRAVELER', 'المسافر'),
    (3, 'PARTNER_ADMIN', 'مدير الشريك'),
    (4, 'DRIVER', 'السائق'),
    (5, 'AGENT', 'وكيل الحجز'),
    (6, 'PARTNER_EMPLOYEE', 'موظف الشريك'),
    (7, 'CUSTOMER_SUPPORT', 'دعم العملاء')
    ON CONFLICT DO NOTHING;

    -- 2. توحيد وتحديث نوع المستخدم في جدول Users الرئيسي (الـ 27 مستخدماً)
    UPDATE public.users SET user_type = 'SUPERUSER'::user_type WHERE user_type::text = 'admin';
    UPDATE public.users SET user_type = 'PARTNER_ADMIN'::user_type WHERE user_type::text = 'partner';
    UPDATE public.users SET user_type = 'PARTNER_EMPLOYEE'::user_type WHERE user_type::text = 'employee';
    UPDATE public.users SET user_type = 'TRAVELER'::user_type WHERE user_type::text IN ('customer', 'user');
    UPDATE public.users SET user_type = 'DRIVER'::user_type WHERE user_type::text = 'driver';

    -- 3. ترحيل وتوحيد الأدوار في جدول user_roles (الأمان)
    UPDATE user_roles SET role = 'SUPERUSER'::app_role WHERE role::text = 'admin';
    UPDATE user_roles SET role = 'PARTNER_ADMIN'::app_role WHERE role::text = 'partner';
    UPDATE user_roles SET role = 'PARTNER_EMPLOYEE'::app_role WHERE role::text = 'employee';

    -- ربط المستخدمين المتبقين بنظام الصلاحيات
    INSERT INTO user_roles (user_id, role)
    SELECT auth_id, 'TRAVELER'::app_role FROM public.users 
    WHERE user_type::text = 'TRAVELER' AND auth_id NOT IN (SELECT user_id FROM user_roles)
    ON CONFLICT DO NOTHING;

    -- 4. إدراج الصلاحيات وتوزيعها
    DELETE FROM role_permissions;
    INSERT INTO role_permissions (role, permission_code) SELECT 'SUPERUSER', permission_code FROM permissions;
    INSERT INTO role_permissions (role, permission_code) SELECT 'PARTNER_ADMIN', permission_code FROM permissions WHERE category IN ('الرحلات', 'الحجوزات', 'الأسطول');
    INSERT INTO role_permissions (role, permission_code) SELECT 'TRAVELER', permission_code FROM permissions WHERE permission_code IN ('trip:read_all', 'booking:create');

    RAISE NOTICE 'تمت عملية الترقية النهائية لـ 27 مستخدماً بنجاح!';
END $$;
