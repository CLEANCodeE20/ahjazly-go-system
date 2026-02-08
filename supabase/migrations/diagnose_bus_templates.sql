-- ========================================================
-- DIAGNOSTIC: Bus Templates & Layout Integrity (Corrected)
-- ========================================================

-- 1. List available templates
SELECT 
    template_id, 
    template_name, 
    capacity,
    jsonb_typeof(seat_layout) as layout_type,
    (seat_layout->>'cells') IS NOT NULL as has_cells,
    jsonb_array_length(seat_layout->'cells') as cell_count
FROM public.bus_templates
ORDER BY template_id DESC
LIMIT 5;

-- 2. Inspect buses using templates (Fixed column name)
SELECT 
    b.bus_id,
    -- Removed plate_number as it caused error
    b.template_id,
    t.template_name,
    jsonb_typeof(b.seat_layout) as bus_layout_type,
    (b.seat_layout->>'cells') IS NOT NULL as bus_has_cells,
    
    -- Check if layout differs from template
    (b.seat_layout::text = t.seat_layout::text) as is_identical
FROM public.buses b
LEFT JOIN public.bus_templates t ON b.template_id = t.template_id
WHERE b.is_active = true
LIMIT 5;

-- 3. Detailed Cell Inspection (for the first mismatched bus)
WITH target_bus AS (
    SELECT b.bus_id, b.seat_layout as bus_layout, t.seat_layout as template_layout
    FROM public.buses b
    JOIN public.bus_templates t ON b.template_id = t.template_id
    WHERE b.seat_layout IS NOT NULL 
    AND t.seat_layout IS NOT NULL
    AND b.seat_layout::text != t.seat_layout::text
    LIMIT 1
)
SELECT 
    'Bus ' || bus_id as context,
    bus_layout as bus_json,
    template_layout as template_json
FROM target_bus;

-- 4. Check Generated Seats for that bus
WITH target_bus AS (
    SELECT b.bus_id
    FROM public.buses b
    JOIN public.bus_templates t ON b.template_id = t.template_id
    WHERE b.seat_layout::text != t.seat_layout::text
    LIMIT 1
)
SELECT 
    s.seat_id,
    s.seat_number,
    s.is_available,
    s.price_adjustment_factor
FROM public.seats s
WHERE s.bus_id = (SELECT bus_id FROM target_bus);
