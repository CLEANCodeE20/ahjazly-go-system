-- Verify seeded permissions
SELECT role, COUNT(*) as permission_count
FROM role_permissions
WHERE partner_id IS NULL
GROUP BY role
ORDER BY role;
