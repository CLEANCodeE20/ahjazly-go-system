-- Seed Initial SDUI Data for Home Page

-- 1. Create Components
INSERT INTO public.ui_components (component_type, component_name, title, subtitle, content, button_text, button_url, status, priority, custom_data)
VALUES 
(
    'hero', 
    'Home Hero', 
    'أدر شركة النقل الخاصة بك بذكاء وكفاءة', 
    'منصة موثوقة لشركات النقل', 
    'منصة "احجزلي" توفر لك كل ما تحتاجه لإدارة أسطولك، رحلاتك، موظفيك وحجوزاتك من مكان واحد', 
    'ابدأ الآن مجاناً', 
    '/apply', 
    'published', 
    100,
    '{}'::jsonb
),
(
    'features', 
    'Home Features', 
    'كل ما تحتاجه في منصة واحدة', 
    NULL, 
    'نوفر لك أدوات متكاملة لإدارة جميع جوانب شركة النقل الخاصة بك', 
    NULL, 
    NULL, 
    'published', 
    90,
    '{
        "features": [
            {"icon": "bus", "title": "إدارة الأسطول", "description": "أضف وتتبع جميع حافلاتك مع بياناتها الكاملة وحالة الترخيص"},
            {"icon": "route", "title": "إدارة الرحلات", "description": "أنشئ مسارات ثابتة وأطلق رحلات جديدة بسهولة تامة"},
            {"icon": "users", "title": "إدارة الموظفين", "description": "نظّم فريقك من سائقين ومشرفين وموظفي مبيعات"},
            {"icon": "building", "title": "إدارة الفروع", "description": "أدر جميع فروعك من مكان واحد مع صلاحيات مخصصة"},
            {"icon": "creditCard", "title": "نظام الحجوزات", "description": "استقبل الحجوزات وتتبع المدفوعات بنظام متكامل"},
            {"icon": "barChart", "title": "تقارير وإحصائيات", "description": "احصل على رؤية شاملة لأداء شركتك بتقارير مفصلة"}
        ]
    }'::jsonb
),
(
    'benefits', 
    'Home Benefits', 
    'لماذا تختار منصة احجزلي؟', 
    NULL, 
    'نحن نفهم احتياجات شركات النقل في المنطقة العربية ونقدم حلولاً مصممة خصيصاً لتلبية هذه الاحتياجات', 
    'انضم إلينا الآن', 
    '/apply', 
    'published', 
    80,
    '{
        "benefits": [
            "واجهة عربية سهلة الاستخدام",
            "دعم فني على مدار الساعة",
            "تحديثات مستمرة ومجانية",
            "حماية وأمان للبيانات",
            "تطبيق جوال للسائقين",
            "تكامل مع بوابات الدفع"
        ],
        "stats": [
            {"value": "500+", "label": "شركة مسجلة"},
            {"value": "10K+", "label": "رحلة شهرياً"},
            {"value": "50K+", "label": "حجز ناجح"},
            {"value": "99%", "label": "رضا العملاء"}
        ]
    }'::jsonb
),
(
    'cta', 
    'Home CTA', 
    'جاهز للبدء؟', 
    NULL, 
    'انضم إلى مئات الشركات التي تثق بمنصة احجزلي لإدارة أعمالها', 
    'قدّم طلب الانضمام', 
    '/apply', 
    'published', 
    70,
    '{
        "secondary_button_text": "تواصل معنا",
        "secondary_button_url": "/contact"
    }'::jsonb
);

-- 2. Link Components to Home Layout
-- Assuming home layout_id is 1 (based on previous migration)
-- Let's find it dynamically
DO $$
DECLARE
    v_layout_id BIGINT;
    v_hero_id BIGINT;
    v_features_id BIGINT;
    v_benefits_id BIGINT;
    v_cta_id BIGINT;
BEGIN
    SELECT layout_id INTO v_layout_id FROM public.ui_page_layouts WHERE page_key = 'home';
    
    SELECT component_id INTO v_hero_id FROM public.ui_components WHERE component_name = 'Home Hero';
    SELECT component_id INTO v_features_id FROM public.ui_components WHERE component_name = 'Home Features';
    SELECT component_id INTO v_benefits_id FROM public.ui_components WHERE component_name = 'Home Benefits';
    SELECT component_id INTO v_cta_id FROM public.ui_components WHERE component_name = 'Home CTA';

    IF v_layout_id IS NOT NULL THEN
        INSERT INTO public.ui_component_placements (layout_id, component_id, display_order, is_visible)
        VALUES 
        (v_layout_id, v_hero_id, 1, true),
        (v_layout_id, v_features_id, 2, true),
        (v_layout_id, v_benefits_id, 3, true),
        (v_layout_id, v_cta_id, 4, true);
    END IF;
END $$;
