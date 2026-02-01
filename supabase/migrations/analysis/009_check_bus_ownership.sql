-- ============================================
-- فحص ملكية الحافلات (Owner vs Partner)
-- ============================================

SELECT 
    c.column_name, 
    c.is_nullable, 
    c.data_type,
    pg_catalog.col_description(format('%s.%s', c.table_schema, c.table_name)::regclass::oid, c.ordinal_position) as column_comment
FROM information_schema.columns c
WHERE table_name = 'buses' AND column_name IN ('partner_id', 'owner_user_id');

-- فحص القيود (Foreign Keys)
SELECT
    tc.constraint_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'buses' AND tc.constraint_type = 'FOREIGN KEY';
