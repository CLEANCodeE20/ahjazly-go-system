-- ============================================
-- سكريبت التأسيس والترقية النهائي لنظام الأدوار
-- ============================================

-- 1. إنشاء جدول الأدوار الجديد (نسخة PostgreSQL المطورة)
CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    display_name_ar TEXT,
    display_name_en TEXT,
    description_ar TEXT,
    description_en TEXT,
    is_default BOOLEAN DEFAULT false,
    partner_id INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. إضافة القيم الجديدة للـ Enum (للسماح بالمسميات الكبيرة والجديدة)
-- ملاحظة: في PostgreSQL لا يمكن إضافة قيم للـ enum داخل بلوك DO أو Transaction في بعض البيئات،
-- لذا نستخدم محاولة إضافة آمنة لكل قيمة.
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'SUPERUSER';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'TRAVELER';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'PARTNER_ADMIN';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'DRIVER';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'AGENT';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'PARTNER_EMPLOYEE';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'CUSTOMER_SUPPORT';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'guest';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'fleet_manager';

-- 3. إدراج الأدوار الـ 9 الأساسية كما حددت في القائمة
INSERT INTO roles (id, name, display_name_ar, display_name_en, description_ar, description_en, is_default, partner_id)
VALUES
(1, 'SUPERUSER', 'المشرف الأعلى', 'Super User', 'وصول كامل وغير مقيد لإدارة النظام والتحكم به.', 'Full and unrestricted access to system management and control.', false, NULL),
(2, 'TRAVELER', 'المسافر', 'Traveler', 'مستخدم عادي يمكنه الحجز وعرض رحلاته.', 'Regular user who can book and view their trips.', true, NULL),
(3, 'PARTNER_ADMIN', 'مدير الشريك', 'Partner Administrator', 'مسؤول عن إدارة جميع عمليات الشريك (رحلات، حافلات، سائقين).', 'Responsible for managing all partner operations (trips, buses, drivers).', false, NULL),
(4, 'DRIVER', 'السائق', 'Driver', 'مسؤول عن تحديث حالة الرحلات الخاصة به.', 'Responsible for updating their trip status.', false, NULL),
(5, 'AGENT', 'وكيل الحجز', 'Booking Agent', 'يمكنه إنشاء حجوزات للعملاء وعرض جميع الحجوزات.', 'Can create bookings for customers and view all bookings.', false, NULL),
(6, 'PARTNER_EMPLOYEE', 'موظف الشريك', 'Partner Employee', 'وصول محدود لإدارة عمليات الشريك (عرض الرحلات والحجوزات).', 'Limited access to manage partner operations (view trips and bookings).', false, NULL),
(7, 'CUSTOMER_SUPPORT', 'دعم العملاء', 'Customer Support', 'وصول لعرض بيانات المستخدمين والحجوزات لحل المشكلات.', 'Access to view user data and bookings for troubleshooting.', false, NULL),
(8, 'guest', 'زائر', 'Guest', 'مستخدم غير مسجل يمكنه تصفح الرحلات.', 'Unregistered user who can browse trips.', true, NULL),
(12, 'fleet_manager', 'مدير الأسطول', NULL, 'إدارة الأسطول المتقدمة', NULL, false, 9)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    display_name_ar = EXCLUDED.display_name_ar,
    display_name_en = EXCLUDED.display_name_en;

-- 4. ترقية المستخدمين الحاليين (17 مستخدماً) للأدوار الجديدة
-- نستخدم CAST لضمان التوافق مع نوع الـ Enum
UPDATE user_roles SET role = 'SUPERUSER'::app_role WHERE role::text = 'admin';
UPDATE user_roles SET role = 'PARTNER_ADMIN'::app_role WHERE role::text = 'partner';
UPDATE user_roles SET role = 'PARTNER_EMPLOYEE'::app_role WHERE role::text = 'employee';

-- 5. تحديث جدول role_permissions ليتوافق مع المسميات الجديدة
-- سنقوم بمسح الربط القديم بالمسميات الصغيرة وتصحيحه للمسميات الكبيرة الاحترافية
DELETE FROM role_permissions;

INSERT INTO role_permissions (role, permission_code)
SELECT 'SUPERUSER', permission_code FROM permissions;

INSERT INTO role_permissions (role, permission_code)
SELECT 'PARTNER_ADMIN', permission_code FROM permissions 
WHERE category IN ('الرحلات', 'الحجوزات', 'الأسطول', 'الموظفين', 'التقارير')
OR permission_code LIKE '%_own';

INSERT INTO role_permissions (role, permission_code)
SELECT 'PARTNER_EMPLOYEE', permission_code FROM permissions 
WHERE permission_code IN ('trip:read_all', 'booking:create', 'booking:read_own', 'bus:read_own');
