-- Check RLS status and policies for multi-tenancy core tables
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('trips', 'bookings', 'buses', 'drivers', 'branches', 'users', 'partners');

-- List policies for these tables
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('trips', 'bookings', 'buses', 'drivers', 'branches', 'users', 'partners');
