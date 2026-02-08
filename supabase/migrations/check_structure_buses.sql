-- استعلام لمعرفة هيكل جدولي buses و bus_templates بدقة
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name IN ('buses', 'bus_templates') 
ORDER BY table_name, ordinal_position;
