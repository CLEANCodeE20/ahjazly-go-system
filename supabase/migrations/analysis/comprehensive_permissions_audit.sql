-- =============================================
-- COMPREHENSIVE PERMISSIONS & ROLES AUDIT SCRIPT
-- سكريبت فحص شامل للصلاحيات والأدوار
-- Date: 2026-01-31
-- Purpose: Verify permissions system implementation
-- Compatible with: Supabase SQL Editor
-- =============================================

-- =============================================
-- SECTION 1: ROLES OVERVIEW
-- نظرة عامة على الأدوار
-- =============================================

-- 1. AVAILABLE ROLES IN SYSTEM
SELECT 
    '1. AVAILABLE ROLES' as section,
    enumlabel as role_name,
    enumsortorder as sort_order
FROM pg_enum
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
WHERE pg_type.typname = 'app_role'
ORDER BY enumsortorder;

-- 2. USERS COUNT BY ROLE
SELECT 
    '2. USERS BY ROLE' as section,
    role,
    COUNT(*) as user_count,
    COUNT(DISTINCT partner_id) as partners_count
FROM public.user_roles
GROUP BY role
ORDER BY user_count DESC;

-- =============================================
-- SECTION 2: RLS POLICIES AUDIT
-- فحص سياسات RLS
-- =============================================

-- 3. RLS STATUS FOR CRITICAL TABLES
SELECT 
    '3. RLS STATUS' as section,
    schemaname,
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ ENABLED'
        ELSE '❌ DISABLED'
    END as rls_status,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = t.tablename) as policies_count
FROM pg_tables t
WHERE schemaname = 'public'
AND tablename IN (
    'users', 'user_roles', 'employees', 'drivers', 
    'routes', 'buses', 'trips', 'route_stops', 'seats',
    'bookings', 'payments', 'wallets', 'documents',
    'branches', 'cancel_policies'
)
ORDER BY tablename;

-- 4. DETAILED RLS POLICIES
SELECT 
    '4. POLICY DETAILS' as section,
    tablename,
    policyname,
    cmd as operation,
    CASE 
        WHEN qual LIKE '%SUPERUSER%' THEN '✅ Has SUPERUSER'
        ELSE '⚠️ No SUPERUSER'
    END as superuser_access,
    CASE 
        WHEN qual LIKE '%PARTNER_ADMIN%' OR qual LIKE '%partner_id%' THEN '✅ Partner-aware'
        ELSE '⚠️ Not partner-aware'
    END as partner_awareness,
    CASE 
        WHEN qual LIKE '%auth.uid()%' OR qual LIKE '%auth_id%' THEN '✅ Modern auth'
        ELSE '⚠️ Legacy auth'
    END as auth_method
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('routes', 'buses', 'trips', 'route_stops', 'employees', 'drivers')
ORDER BY tablename, policyname;

-- =============================================
-- SECTION 3: ROLE DIFFERENTIATION CHECK
-- فحص التمييز بين الأدوار
-- =============================================

-- 5. ROLE DIFFERENTIATION ANALYSIS
WITH role_policies AS (
    SELECT 
        tablename,
        policyname,
        qual
    FROM pg_policies
    WHERE schemaname = 'public'
)
SELECT 
    '5. ROLE DIFFERENTIATION' as section,
    tablename,
    COUNT(*) as total_policies,
    COUNT(CASE WHEN qual LIKE '%PARTNER_ADMIN%' THEN 1 END) as partner_admin_policies,
    COUNT(CASE WHEN qual LIKE '%manager%' THEN 1 END) as manager_policies,
    COUNT(CASE WHEN qual LIKE '%accountant%' THEN 1 END) as accountant_policies,
    COUNT(CASE WHEN qual LIKE '%support%' THEN 1 END) as support_policies,
    CASE 
        WHEN COUNT(CASE WHEN qual LIKE '%manager%' THEN 1 END) > 0 
             OR COUNT(CASE WHEN qual LIKE '%accountant%' THEN 1 END) > 0 
        THEN '✅ Role-specific'
        ELSE '⚠️ All equal'
    END as differentiation_status
FROM role_policies
WHERE tablename IN ('routes', 'buses', 'trips', 'bookings', 'payments')
GROUP BY tablename
ORDER BY tablename;

-- =============================================
-- SECTION 4: PERMISSION GAPS
-- الثغرات في الصلاحيات
-- =============================================

-- 6. TABLES WITHOUT RLS
SELECT 
    '6. TABLES WITHOUT RLS' as section,
    tablename,
    '❌ NO RLS' as status,
    'HIGH RISK' as severity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename NOT IN (
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' AND rowsecurity = true
)
AND tablename NOT LIKE 'pg_%'
AND tablename NOT LIKE 'sql_%'
AND tablename IN (
    'users', 'bookings', 'payments', 'wallets', 
    'routes', 'buses', 'trips', 'employees', 'drivers'
)
ORDER BY tablename;

-- 7. POLICIES USING LEGACY user_id
SELECT 
    '7. LEGACY POLICIES' as section,
    tablename,
    policyname,
    '⚠️ USES user_id' as issue
FROM pg_policies
WHERE schemaname = 'public'
AND qual LIKE '%user_id%'
AND qual NOT LIKE '%auth_id%';

-- =============================================
-- SECTION 5: JWT CLAIMS VERIFICATION
-- التحقق من JWT Claims
-- =============================================

-- 8. JWT METADATA SYNC CHECK
SELECT 
    '8. JWT SYNC STATUS' as section,
    COUNT(*) as total_users,
    COUNT(CASE 
        WHEN (SELECT raw_app_meta_data->>'role' FROM auth.users WHERE id = ur.auth_id) IS NOT NULL 
        THEN 1 
    END) as users_with_jwt_role,
    COUNT(CASE 
        WHEN (SELECT raw_app_meta_data->>'partner_id' FROM auth.users WHERE id = ur.auth_id) IS NOT NULL 
        THEN 1 
    END) as users_with_jwt_partner,
    CASE 
        WHEN COUNT(*) = COUNT(CASE 
            WHEN (SELECT raw_app_meta_data->>'role' FROM auth.users WHERE id = ur.auth_id) IS NOT NULL 
            THEN 1 
        END) THEN '✅ All synced'
        ELSE '⚠️ Missing JWT data'
    END as sync_status
FROM public.user_roles ur
WHERE auth_id IS NOT NULL;

-- =============================================
-- SECTION 6: CRITICAL SECURITY CHECKS
-- فحوصات الأمان الحرجة
-- =============================================

-- 9. CRITICAL SECURITY ISSUES
SELECT 
    '9. SECURITY ISSUES' as section,
    tablename,
    policyname,
    '🔴 PUBLIC ACCESS' as issue
FROM pg_policies
WHERE schemaname = 'public'
AND cmd = 'ALL'
AND qual = 'true'
AND tablename IN ('users', 'payments', 'wallets', 'bookings');

-- 10. SUPERUSER BYPASS CHECK
SELECT 
    '10. SUPERUSER BYPASS' as section,
    tablename,
    COUNT(*) as total_policies,
    COUNT(CASE WHEN qual LIKE '%SUPERUSER%' THEN 1 END) as with_superuser,
    CASE 
        WHEN COUNT(*) = COUNT(CASE WHEN qual LIKE '%SUPERUSER%' THEN 1 END) 
        THEN '✅ All have bypass'
        ELSE '⚠️ Missing bypass'
    END as status
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('routes', 'buses', 'trips', 'employees', 'drivers')
GROUP BY tablename;

-- =============================================
-- SECTION 7: SUMMARY & RECOMMENDATIONS
-- التقرير الملخص
-- =============================================

-- 11. AUDIT SUMMARY
WITH audit_summary AS (
    SELECT 
        (SELECT COUNT(*) FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'app_role') as total_roles,
        (SELECT COUNT(DISTINCT tablename) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true) as tables_with_rls,
        (SELECT COUNT(DISTINCT tablename) FROM pg_policies WHERE schemaname = 'public') as tables_with_policies,
        (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND qual LIKE '%user_id%' AND qual NOT LIKE '%auth_id%') as legacy_policies,
        (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND (qual LIKE '%manager%' OR qual LIKE '%accountant%')) as role_specific_policies
)
SELECT 
    '11. SUMMARY' as section,
    '📊 Total Roles' as metric,
    total_roles::text as value
FROM audit_summary
UNION ALL
SELECT 
    '11. SUMMARY' as section,
    '🔒 Tables with RLS' as metric,
    tables_with_rls::text as value
FROM audit_summary
UNION ALL
SELECT 
    '11. SUMMARY' as section,
    '📋 Tables with Policies' as metric,
    tables_with_policies::text as value
FROM audit_summary
UNION ALL
SELECT 
    '11. SUMMARY' as section,
    '⚠️ Legacy Policies' as metric,
    legacy_policies::text as value
FROM audit_summary
UNION ALL
SELECT 
    '11. SUMMARY' as section,
    '✅ Role-Specific' as metric,
    role_specific_policies::text as value
FROM audit_summary;

-- =============================================
-- INTERPRETATION GUIDE:
-- ✅ = Good, working as expected
-- ⚠️ = Warning, needs attention
-- ❌ = Critical, must be fixed
-- 🔴 = Security risk, immediate action required
-- =============================================
