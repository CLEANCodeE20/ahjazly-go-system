-- Check RLS and Policies for permissions table
SELECT 
    t.tablename, 
    t.rowsecurity, 
    p.policyname, 
    p.cmd, 
    p.qual 
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename
WHERE t.tablename = 'permissions';

-- Check count
SELECT COUNT(*) FROM permissions;
