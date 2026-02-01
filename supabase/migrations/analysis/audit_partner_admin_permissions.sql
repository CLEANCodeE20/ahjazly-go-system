-- List all permissions for PARTNER_ADMIN to identify platform-specific ones
SELECT 
    rp.permission_code,
    p.action,
    p.resource
FROM role_permissions rp
JOIN permissions p ON p.permission_code = rp.permission_code
WHERE rp.role = 'PARTNER_ADMIN'
ORDER BY p.resource, p.action;
