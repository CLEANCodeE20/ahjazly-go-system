-- استعلام لمعرفة هيكل جدول seats
SELECT 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'seats'
ORDER BY ordinal_position;
