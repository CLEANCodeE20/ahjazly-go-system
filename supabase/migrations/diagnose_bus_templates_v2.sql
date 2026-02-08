-- ========================================================
-- DIAGNOSTIC V2: Bus Templates & Layout Integrity
-- ========================================================

-- 1. ابحث عن الباصات التي تستخدم قوالب ولكن تصميمها مختلف
SELECT 
    b.bus_id,
    b.license_plate,
    t.template_name,
    -- مقارنة حجم البيانات (غالباً البيانات الناقصة تكون أصغر حجماً)
    length(b.seat_layout::text) as bus_layout_size,
    length(t.seat_layout::text) as template_layout_size,
    -- هل يحتوي على cells؟
    jsonb_array_length(b.seat_layout->'cells') as bus_cells,
    jsonb_array_length(t.seat_layout->'cells') as template_cells
FROM public.buses b
JOIN public.bus_templates t ON b.template_id = t.template_id
WHERE b.seat_layout::text != t.seat_layout::text
LIMIT 5;

-- 2. تحليل عميق لباص واحد (أول باص مختلف)
WITH diff_bus AS (
    SELECT 
        b.bus_id, 
        b.seat_layout as bus_json, 
        t.seat_layout as template_json
    FROM public.buses b
    JOIN public.bus_templates t ON b.template_id = t.template_id
    WHERE b.seat_layout::text != t.seat_layout::text
    LIMIT 1
)
SELECT 
    'Structure Comparison' as test,
    -- قارن بنية أول خلية (Cell) لنرى هل فقدنا خصائص التصميم
    (bus_json->'cells'->0) as first_cell_bus,
    (template_json->'cells'->0) as first_cell_template
FROM diff_bus;

-- 3. فحص المقاعد في جدول seats لهذا الباص
WITH diff_bus AS (
    SELECT b.bus_id
    FROM public.buses b
    JOIN public.bus_templates t ON b.template_id = t.template_id
    WHERE b.seat_layout::text != t.seat_layout::text
    LIMIT 1
)
SELECT 
    count(*) as total_seats_in_table,
    count(CASE WHEN is_available = true THEN 1 END) as available_seats,
    avg(price_adjustment_factor) as avg_factor
FROM public.seats
WHERE bus_id = (SELECT bus_id FROM diff_bus);
