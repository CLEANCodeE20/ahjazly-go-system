-- =============================================
-- FIX MISSING BUS CLASS RELATIONSHIPS
-- إصلاح العلاقات المفقودة لفئات الحافلات
-- =============================================

-- الخطوة 1: التحقق من فئات الحافلات الموجودة
SELECT 'Existing Bus Classes:' as info;
SELECT bus_class_id, class_name FROM public.bus_classes;

-- الخطوة 2: عرض الحافلات التي تحتاج إصلاح
SELECT 'Buses needing fix:' as info;
SELECT bus_id, model, bus_class_id, bus_type 
FROM public.buses 
WHERE bus_class_id IS NULL;

-- الخطوة 3: إنشاء فئات الحافلات إذا لم تكن موجودة
INSERT INTO public.bus_classes (bus_class_id, class_name, description, price_adjustment_factor)
VALUES 
    (1, 'VIP', 'درجة VIP فاخرة', 1.50),
    (2, 'Standard', 'درجة عادية', 1.00),
    (3, 'Business', 'درجة رجال الأعمال', 1.30)
ON CONFLICT (bus_class_id) DO NOTHING;

-- الخطوة 4: تحديث الحافلات بناءً على نوعها (bus_type)
-- إذا كانت الحافلة من نوع 'vip' أو 'sleeper' → فئة VIP
UPDATE public.buses
SET bus_class_id = 1
WHERE bus_class_id IS NULL 
  AND (bus_type = 'vip' OR bus_type = 'sleeper');

-- إذا كانت الحافلة من نوع 'standard' → فئة Standard
UPDATE public.buses
SET bus_class_id = 2
WHERE bus_class_id IS NULL 
  AND bus_type = 'standard';

-- إذا كانت الحافلة من نوع 'double_decker' → فئة Business
UPDATE public.buses
SET bus_class_id = 3
WHERE bus_class_id IS NULL 
  AND bus_type = 'double_decker';

-- أي حافلات متبقية بدون فئة → فئة Standard (افتراضي)
UPDATE public.buses
SET bus_class_id = 2
WHERE bus_class_id IS NULL;

-- الخطوة 5: التحقق من النتيجة
SELECT 'After Fix - Buses with Classes:' as info;
SELECT 
    b.bus_id,
    b.model,
    b.bus_type,
    bc.class_name
FROM public.buses b
LEFT JOIN public.bus_classes bc ON b.bus_class_id = bc.bus_class_id
ORDER BY b.bus_id;

-- الخطوة 6: اختبار البحث الآن
SELECT 'Testing Search After Fix:' as info;
SELECT * FROM public.search_trips(
    'صنعاء',
    'عدن',
    CURRENT_DATE,
    'VIP'
) LIMIT 3;

-- إذا لم يعمل VIP، جرب Standard
SELECT 'Testing with Standard:' as info;
SELECT * FROM public.search_trips(
    'صنعاء',
    'عدن',
    CURRENT_DATE,
    'Standard'
) LIMIT 3;
