-- ============================================
-- سكريبت تفعيل نظام الصلاحيات المتقدم (RBAC)
-- متوافق مع Supabase والكود المصدري الحالي
-- ============================================

DO $$ 
BEGIN
    RAISE NOTICE 'بدء تفعيل نظام الصلاحيات المطور...';

    -- 1. التأكد من هيكل الجداول الحالي وتحديثه ليتوافق مع الكود المصدري
    -- نغير المسميات لتطابق ما يتوقعه الـ Frontend (PermissionManagement.tsx)
    
    -- إذا كان العمود 'name' موجوداً، نغيره لـ 'permission_code'
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'permissions' AND column_name = 'name') THEN
        ALTER TABLE permissions RENAME COLUMN name TO permission_code;
    END IF;

    -- إذا كان العمود 'module' موجوداً، نغيره لـ 'category'
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'permissions' AND column_name = 'module') THEN
        ALTER TABLE permissions RENAME COLUMN module TO category;
    END IF;

    -- التأكد من وجود عمود الوصف العام ليتوافق مع الواجهة
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'permissions' AND column_name = 'description') THEN
        ALTER TABLE permissions ADD COLUMN description TEXT;
    END IF;

    -- 2. تنظيف البيانات القديمة (اختياري - لضمان بداية نظيفة)
    DELETE FROM role_permissions;
    DELETE FROM permissions;

    -- 3. إدراج الصلاحيات الـ 48 (تم تحويلها لتطابق الهيكل المعتمد)
    INSERT INTO permissions (permission_code, category, description) VALUES
    ('trip:create', 'الرحلات', 'إنشاء رحلات جديدة يدوياً'),
    ('trip:read_all', 'الرحلات', 'عرض جميع الرحلات في النظام'),
    ('trip:update', 'الرحلات', 'تعديل تفاصيل الرحلة'),
    ('trip:cancel', 'الرحلات', 'إلغاء الرحلات'),
    ('trip:read_own', 'الرحلات', 'عرض رحلات الشريك الخاصة'),
    
    ('booking:create', 'الحجوزات', 'إنشاء حجز جديد'),
    ('booking:read_own', 'الحجوزات', 'عرض حجوزات المستخدم الخاصة'),
    ('booking:read_all', 'الحجوزات', 'عرض جميع الحجوزات في النظام'),
    ('booking:cancel', 'الحجوزات', 'إلغاء الحجوزات'),
    
    ('user:read_all', 'المستخدمين', 'عرض قائمة جميع المستخدمين'),
    ('user:update_role', 'المستخدمين', 'تعديل أدوار وصلاحيات المستخدمين'),
    
    ('admin:full_access', 'الإدارة', 'وصول كامل لوحة تحكم المشرف'),
    ('admin:manage_roles', 'الإدارة', 'إدارة الأدوار والصلاحيات'),
    
    ('system:analytics:view', 'التقارير', 'عرض لوحة تحكم تحليلية شاملة'),
    ('partners:manage', 'الشركاء', 'إدارة بيانات الشركاء (العمولة، الحالة)'),
    
    ('bus:create', 'الأسطول', 'إضافة حافلة جديدة للشريك'),
    ('bus:read_own', 'الأسطول', 'عرض قائمة حافلات الشريك'),
    ('bus:update_own', 'الأسطول', 'تعديل بيانات حافلة الشريك'),
    
    ('driver:create', 'الموظفين', 'إضافة سائق جديد'),
    ('driver:read_own', 'الموظفين', 'عرض قائمة السائقين'),
    
    ('analytics:view_own', 'التقارير', 'عرض التحليلات الخاصة بالشريك'),
    ('settlements:read_own', 'المالية', 'عرض التسويات المالية للشريك');

    -- 4. ربط الصلاحيات بالأدوار الحالية (استخدام مسميات الأدوار الفعلية)
    -- ملاحظة: نستخدم النوع المصبوب (::text) للتوافق مع enum
    
    -- دور الأدمن (Admin): يأخذ كل شيء
    INSERT INTO role_permissions (role, permission_code)
    SELECT 'admin', permission_code FROM permissions;

    -- دور الشريك (Partner): صلاحيات العمليات الخاصة به
    INSERT INTO role_permissions (role, permission_code)
    SELECT 'partner', permission_code FROM permissions 
    WHERE category IN ('الرحلات', 'الحجوزات', 'الأسطول', 'الموظفين', 'التقارير')
    OR permission_code LIKE '%_own';

    -- دور الموظف (Employee): صلاحيات العرض والحجز فقط
    INSERT INTO role_permissions (role, permission_code)
    SELECT 'employee', permission_code FROM permissions 
    WHERE permission_code IN ('trip:read_all', 'booking:create', 'booking:read_own', 'bus:read_own');

    RAISE NOTICE 'تم تفعيل نظام الصلاحيات بنجاح وربطه بـ % صلاحية.', (SELECT count(*) FROM permissions);
END $$;
