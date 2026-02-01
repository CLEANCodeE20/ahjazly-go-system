-- ============================================
-- فحص الاعتماديات لعمود seats.is_available
-- ============================================

SELECT
    dependent_ns.nspname AS dependent_schema,
    dependent_view.relname AS dependent_view, 
    source_ns.nspname AS source_schema,
    source_table.relname AS source_table,
    pg_attribute.attname AS column_name
FROM pg_depend 
JOIN pg_rewrite ON pg_depend.objid = pg_rewrite.oid 
JOIN pg_class as dependent_view ON pg_rewrite.ev_class = dependent_view.oid 
JOIN pg_class as source_table ON pg_depend.refobjid = source_table.oid 
JOIN pg_attribute ON pg_depend.refobjid = pg_attribute.attrelid 
    AND pg_depend.refobjsubid = pg_attribute.attnum 
JOIN pg_namespace dependent_ns ON dependent_view.relnamespace = dependent_ns.oid 
JOIN pg_namespace source_ns ON source_table.relnamespace = source_ns.oid 
WHERE source_table.relname = 'seats' 
AND pg_attribute.attname = 'is_available';
