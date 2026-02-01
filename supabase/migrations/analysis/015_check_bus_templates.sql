-- ============================================
-- فحص هيكل bus_templates ومقارنته بالمطلوب
-- ============================================

SELECT 
    c.column_name, 
    c.data_type,
    c.is_nullable
FROM information_schema.columns c
WHERE table_name = 'bus_templates';
