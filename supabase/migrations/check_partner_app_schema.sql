
-- Check table definition for partner_applications
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'partner_applications';
