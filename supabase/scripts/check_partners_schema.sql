-- CHECK TABLE STRUCTURE for 'partners'
-- Lists all columns, data types, and nullability

SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    character_maximum_length,
    column_default 
FROM 
    information_schema.columns 
WHERE 
    table_name = 'partners' 
ORDER BY 
    ordinal_position;
