-- Check if partner_id is populated in user_roles for partners/employees
SELECT 
    u.user_id, 
    u.user_type, 
    ur.role, 
    ur.partner_id as ur_partner_id,
    u.partner_id as u_partner_id
FROM public.users u
JOIN public.user_roles ur ON u.auth_id = ur.user_id
WHERE u.user_type IN ('partner', 'PARTNER_ADMIN', 'employee', 'PARTNER_EMPLOYEE')
LIMIT 20;
