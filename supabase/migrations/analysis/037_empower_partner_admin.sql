-- ============================================
-- تفعيل القوة الكاملة لمدير الشركة (PARTNER_ADMIN)
-- ============================================

DO $$
BEGIN
    -- 1. إضافة الصلاحيات المالية لمدير الشركة
    INSERT INTO role_permissions (role, permission_code)
    VALUES 
        ('PARTNER_ADMIN', 'financial.view'),
        ('PARTNER_ADMIN', 'financial.export')
    ON CONFLICT DO NOTHING;

    -- 2. إضافة صلاحيات الإعدادات لمدير الشركة
    INSERT INTO role_permissions (role, permission_code)
    VALUES 
        ('PARTNER_ADMIN', 'settings.view'),
        ('PARTNER_ADMIN', 'settings.edit')
    ON CONFLICT DO NOTHING;

    -- 3. التأكد من وجود كافة صلاحيات الرحلات والحجوزات والأسطول
    INSERT INTO role_permissions (role, permission_code)
    SELECT 'PARTNER_ADMIN', permission_code 
    FROM permissions 
    WHERE category IN ('الرحلات', 'الحجوزات', 'الأسطول')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'تم تفعيل القوة الكاملة لمدير الشركة بنجاح! 🚀💼';
END $$;

-- التحقق النهائي من القائمة الكاملة
SELECT p.permission_code, p.category, p.description
FROM permissions p
JOIN role_permissions rp ON p.permission_code = rp.permission_code
WHERE rp.role = 'PARTNER_ADMIN'
ORDER BY p.category;
