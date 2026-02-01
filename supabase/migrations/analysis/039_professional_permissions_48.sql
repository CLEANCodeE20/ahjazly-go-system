-- ==========================================================
-- ترقية نظام الصلاحيات للمستوى الاحترافي (48 صلاحية)
-- ضمان التوافق التام مع الكود المصدري (Frontend)
-- ==========================================================

BEGIN;

-- 1. تنظيف الصلاحيات القديمة لضمان هيكلة جديدة ونظيفة
TRUNCATE public.role_permissions CASCADE;
TRUNCATE public.permissions CASCADE;

-- 2. إدراج الـ 48 صلاحية الاحترافية
INSERT INTO public.permissions (permission_code, category, description) VALUES
-- الرحلات (8)
('trips.view', 'الرحلات', 'عرض قائمة الرحلات وتفاصيلها'),
('trips.create', 'الرحلات', 'إضافة رحلات جديدة وجدولتها'),
('trips.edit', 'الرحلات', 'تعديل تفاصيل الرحلات الحالية'),
('trips.delete', 'الرحلات', 'حذف الرحلات أو إلغاؤها'),
('trips.approve', 'الرحلات', 'الموافقة على الرحلات (للمشرفين)'),
('trips.manage', 'الرحلات', 'إدارة شاملة لعمليات الرحلات'),
('trips.clone', 'الرحلات', 'نسخ الرحلات وتكرارها سريعاً'),
('trips.manifest', 'الرحلات', 'عرض وتحميل كشوفات الركاب'),

-- الحجوزات (7)
('bookings.view', 'الحجوزات', 'عرض الحجوزات والبحث فيها'),
('bookings.create', 'الحجوزات', 'إنشاء حجز جديد للعملاء'),
('bookings.edit', 'الحجوزات', 'تعديل بيانات الحجز أو المقاعد'),
('bookings.cancel', 'الحجوزات', 'إلغاء الحجوزات'),
('bookings.refund', 'الحجوزات', 'معالجة استرداد الأموال'),
('bookings.manage', 'الحجوزات', 'إدارة شاملة لدورة حياة الحجز'),
('bookings.checkin', 'الحجوزات', 'تحضير الركاب وتأكيد الصعود'),

-- الأسطول (6)
('fleet.view', 'الأسطول', 'عرض قائمة الحافلات والسائقين'),
('fleet.manage', 'الأسطول', 'إدارة شاملة للأسطول (إضافة/تعديل/حذف)'),
('fleet.create', 'الأسطول', 'إضافة حافلات أو سائقين جدد'),
('fleet.edit', 'الأسطول', 'تعديل بيانات الحافلات والسائقين'),
('fleet.delete', 'الأسطول', 'حذف الحافلات أو السائقين من النظام'),
('fleet.maintenance', 'الأسطول', 'إدارة سجلات الصيانة والتفتيش'),

-- المالية (6)
('finance.view', 'المالية', 'عرض التقارير المالية والإيرادات'),
('finance.export', 'المالية', 'تصدير كشوفات الحساب والبيانات'),
('finance.settlements', 'المالية', 'إدارة تسويات الشركاء'),
('finance.withdrawals', 'المالية', 'إدارة طلبات السحب'),
('finance.deposits', 'المالية', 'إدارة عمليات الإيداع'),
('finance.wallets', 'المالية', 'إدارة محافظ المستخدمين والشركات'),

-- المستخدمين والموظفين (6)
('employees.view', 'المستخدمين', 'عرض قائمة الموظفين وفريق العمل'),
('employees.manage', 'المستخدمين', 'إدارة شاملة لبيانات الموظفين'),
('employees.create', 'المستخدمين', 'إضافة موظفين جدد للنظام'),
('employees.edit', 'المستخدمين', 'تعديل بيانات الموظفين الحالية'),
('employees.delete', 'المستخدمين', 'حذف حسابات الموظفين وتعطيلها'),
('employees.roles', 'المستخدمين', 'إدارة أدوار الموظفين وصلاحياتهم'),

-- الإعدادات (5)
('settings.view', 'الإعدادات', 'عرض إعدادات الشركة'),
('settings.manage', 'الإعدادات', 'إدارة إعدادات النظام المتقدمة'),
('settings.edit', 'الإعدادات', 'تعديل إعدادات وسياسات التشغيل'),
('settings.policies', 'الإعدادات', 'إدارة سياسات الإلغاء والاسترداد'),
('settings.profile', 'الإعدادات', 'تعديل الملف الشخصي وبيانات التواصل'),

-- التقارير (5)
('reports.view', 'التقارير', 'عرض مركز التقارير'),
('reports.analytics', 'التقارير', 'عرض التحليلات والرسوم البيانية'),
('reports.sales', 'التقارير', 'عرض تقارير المبيعات التفصيلية'),
('reports.performance', 'التقارير', 'عرض تقارير أداء الرحلات والسائقين'),
('reports.export', 'التقارير', 'تصدير التقارير بصيغ مختلفة (PDF/Excel)'),

-- المسارات (5)
('routes.view', 'المسارات', 'عرض المسارات والمدن والوحدات'),
('routes.manage', 'المسارات', 'إدارة شاملة للمسارات والأسعار'),
('routes.create', 'المسارات', 'إضافة مسارات ومحطات جديدة'),
('routes.edit', 'المسارات', 'تعديل تفاصيل المسارات والأسعار'),
('routes.delete', 'المسارات', 'حذف المسارات غير النشطة');

-- 3. إعادة توزيع الصلاحيات على الأدوار الأساسية (System Defaults)

-- SUPERVISOR (مشرف): صلاحيات تشغيلية واسعة
INSERT INTO public.role_permissions (role, permission_code)
SELECT 'supervisor', permission_code 
FROM public.permissions 
WHERE category IN ('الرحلات', 'الحجوزات', 'الأسطول', 'المسارات');

-- ACCOUNTANT (محاسب): صلاحيات مالية وتقارير
INSERT INTO public.role_permissions (role, permission_code)
SELECT 'accountant', permission_code 
FROM public.permissions 
WHERE category IN ('المالية', 'التقارير') OR permission_code IN ('bookings.view', 'bookings.refund');

-- SUPPORT (خدمة عملاء): حجوزات وعرض بيانات
INSERT INTO public.role_permissions (role, permission_code)
SELECT 'support', permission_code 
FROM public.permissions 
WHERE permission_code IN ('bookings.view', 'bookings.create', 'bookings.edit', 'trips.view', 'routes.view');

-- DRIVER (سائق): عرض رحلات فقط
INSERT INTO public.role_permissions (role, permission_code)
VALUES ('driver', 'trips.view');

-- ASSISTANT (مساعد سائق): عرض رحلات فقط
INSERT INTO public.role_permissions (role, permission_code)
VALUES ('assistant', 'trips.view');

-- MANAGER (مدير فرع): كافة الصلاحيات التشغيلية
INSERT INTO public.role_permissions (role, permission_code)
SELECT 'manager', permission_code 
FROM public.permissions 
WHERE category IN ('الرحلات', 'الحجوزات', 'الأسطول', 'المسارات', 'المستخدمين', 'التقارير');

-- PARTNER_ADMIN (مدير شركة): كل شيء ما عدا صلاحيات النظام العليا
INSERT INTO public.role_permissions (role, permission_code)
SELECT 'PARTNER_ADMIN', permission_code FROM public.permissions;

-- SUPERUSER (الآدمن الأعلى): كل شيء
INSERT INTO public.role_permissions (role, permission_code)
SELECT 'SUPERUSER', permission_code FROM public.permissions;

COMMIT;
