-- ============================================
-- جرد شامل لكافة الصلاحيات المتاحة في النظام
-- ============================================

SELECT category, count(*) as count
FROM permissions
GROUP BY category;

SELECT permission_code, category, description
FROM permissions
ORDER BY category, permission_code;
