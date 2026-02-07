-- CHECK USER DATA
-- Verify if PARTNER_ADMIN users have partner_id set in public.users

SELECT 
    u.auth_id, 
    u.partner_id as user_partner_id, 
    ur.partner_id as role_partner_id,
    ur.role
FROM public.users u
JOIN public.user_roles ur ON u.auth_id = ur.auth_id
WHERE ur.role = 'PARTNER_ADMIN'
LIMIT 10;
