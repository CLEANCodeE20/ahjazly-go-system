-- ==========================================================
-- GOLD STANDARD VERIFICATION SCRIPT
-- التحقق من شمولية التحول للمعيار الذهبي
-- Date: 2026-01-31
-- ==========================================================

-- ========================================
-- SECTION 1: VERIFY COLUMN REMOVAL
-- التحقق من حذف الأعمدة القديمة
-- ========================================

-- Test 1: Check for user_id columns in main tables
SELECT 
    'LEGACY_COLUMN_CHECK' as test_name,
    table_name, 
    column_name,
    'FAIL - user_id column still exists' as status
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND column_name = 'user_id'
  AND table_name IN ('users', 'bookings', 'notifications', 'ratings', 'wallets', 'employees', 'passengers', 'support_tickets', 'user_device_tokens')
UNION ALL
SELECT 
    'LEGACY_COLUMN_CHECK' as test_name,
    'ALL_TABLES' as table_name,
    'user_id' as column_name,
    'PASS - No user_id columns found' as status
WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND column_name = 'user_id'
      AND table_name IN ('users', 'bookings', 'notifications', 'ratings', 'wallets', 'employees', 'passengers', 'support_tickets', 'user_device_tokens')
);

-- Test 2: Check for user_type column
SELECT 
    'USER_TYPE_CHECK' as test_name,
    'users' as table_name,
    column_name,
    'FAIL - user_type column still exists' as status
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users' 
  AND column_name = 'user_type'
UNION ALL
SELECT 
    'USER_TYPE_CHECK' as test_name,
    'users' as table_name,
    'user_type' as column_name,
    'PASS - user_type column removed' as status
WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name = 'user_type'
);

-- ========================================
-- SECTION 2: VERIFY auth_id COLUMNS
-- التحقق من وجود أعمدة auth_id
-- ========================================

-- Test 3: Verify auth_id exists in critical tables
SELECT 
    'AUTH_ID_EXISTENCE' as test_name,
    t.table_name,
    CASE 
        WHEN c.column_name IS NOT NULL THEN 'PASS - auth_id exists'
        ELSE 'FAIL - auth_id missing'
    END as status,
    c.data_type
FROM (
    VALUES 
        ('users'),
        ('bookings'),
        ('notifications'),
        ('ratings'),
        ('wallets'),
        ('employees'),
        ('passengers'),
        ('support_tickets')
) AS t(table_name)
LEFT JOIN information_schema.columns c 
    ON c.table_schema = 'public' 
    AND c.table_name = t.table_name 
    AND c.column_name = 'auth_id';

-- ========================================
-- SECTION 3: VERIFY INDEXES
-- التحقق من الفهارس
-- ========================================

-- Test 4: Check for auth_id indexes
SELECT 
    'INDEX_CHECK' as test_name,
    tablename,
    indexname,
    'PASS - Index exists' as status
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE '%auth_id%'
ORDER BY tablename;

-- Test 5: Identify missing indexes
SELECT 
    'MISSING_INDEX_CHECK' as test_name,
    t.table_name,
    'FAIL - Missing auth_id index' as status
FROM (
    VALUES 
        ('users'),
        ('bookings'),
        ('notifications'),
        ('ratings'),
        ('wallets'),
        ('employees')
) AS t(table_name)
WHERE NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = t.table_name
      AND indexname LIKE '%auth_id%'
);

-- ========================================
-- SECTION 4: VERIFY RLS POLICIES
-- التحقق من سياسات RLS
-- ========================================

-- Test 6: Check for any RLS policies still using user_id
SELECT 
    schemaname,
    tablename,
    policyname,
    qual as policy_definition
FROM pg_policies
WHERE schemaname = 'public'
AND qual LIKE '%user_id%';
-- Expected: 0 rows (all policies should use auth_id or JWT claims)

-- Test 7: Verify policies use auth_id or JWT claims
SELECT 
    'RLS_MODERN_CHECK' as test_name,
    tablename,
    policyname,
    CASE 
        WHEN qual LIKE '%auth_id%' OR qual LIKE '%auth.uid()%' OR qual LIKE '%auth.jwt()%' 
        THEN 'PASS - Uses modern auth'
        ELSE 'WARN - Check policy definition'
    END as status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('bookings', 'notifications', 'ratings', 'wallets', 'support_tickets')
ORDER BY tablename, policyname;

-- ========================================
-- SECTION 5: VERIFY FUNCTIONS
-- التحقق من الدوال
-- ========================================

-- Test 8: Check function definitions for user_id references
SELECT 
    'FUNCTION_CHECK' as test_name,
    n.nspname as schema_name,
    p.proname as function_name,
    CASE 
        WHEN pg_get_functiondef(p.oid) LIKE '%user_id%' 
        THEN 'WARN - Function may use user_id'
        ELSE 'PASS - No user_id reference'
    END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('handle_new_user', 'notify_admin_new_partner', 'notify_partner_rating', 'log_user_activity')
ORDER BY p.proname;

-- ========================================
-- SECTION 6: DATA INTEGRITY CHECKS
-- فحوصات سلامة البيانات
-- ========================================

-- Test 9: Verify all users have auth_id
SELECT 
    'USER_AUTH_ID_CHECK' as test_name,
    COUNT(*) as total_users,
    COUNT(auth_id) as users_with_auth_id,
    CASE 
        WHEN COUNT(*) = COUNT(auth_id) THEN 'PASS - All users have auth_id'
        ELSE 'FAIL - Some users missing auth_id'
    END as status
FROM public.users;

-- Test 10: Check for orphaned records
SELECT 
    'ORPHANED_BOOKINGS_CHECK' as test_name,
    COUNT(*) as orphaned_count,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS - No orphaned bookings'
        ELSE 'FAIL - Orphaned bookings exist'
    END as status
FROM public.bookings b
WHERE NOT EXISTS (
    SELECT 1 FROM public.users u WHERE u.auth_id = b.auth_id
);

-- Test 11: Verify user_roles table uses UUID
SELECT 
    'USER_ROLES_TYPE_CHECK' as test_name,
    data_type,
    CASE 
        WHEN data_type = 'uuid' THEN 'PASS - user_id is UUID'
        ELSE 'FAIL - user_id is not UUID'
    END as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_roles'
  AND column_name = 'user_id';

-- ========================================
-- SECTION 7: SUMMARY REPORT
-- التقرير الملخص
-- ========================================

-- Generate summary
SELECT 
    '========================================' as separator,
    'GOLD STANDARD VERIFICATION SUMMARY' as report_title,
    '========================================' as separator2,
    NOW() as verification_time;

-- Count total tests
SELECT 
    'Total Verification Tests' as metric,
    11 as count;

-- Expected results
SELECT 
    'Expected Result' as metric,
    'All tests should PASS for complete gold standard compliance' as description;
