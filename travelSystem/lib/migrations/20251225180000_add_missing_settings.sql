-- Add missing site settings
INSERT INTO public.ui_site_settings (setting_key, setting_value, setting_type, setting_group, description, is_public)
VALUES
('maintenance_mode', 'false', 'boolean', 'system', 'وضع الصيانة', true),
('allow_new_registrations', 'true', 'boolean', 'system', 'تفعيل تسجيل الشركاء', true),
('notify_on_new_application', 'true', 'boolean', 'notifications', 'تنبيهات الطلبات الجديدة', false),
('default_commission', '10', 'number', 'financial', 'نسبة العمولة الافتراضية', false)
ON CONFLICT (setting_key) DO NOTHING;
