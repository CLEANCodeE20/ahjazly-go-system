-- Check recent applications and their partner status
SELECT 
    pa.id as app_id, 
    pa.company_name, 
    pa.owner_email, 
    pa.status as app_status, 
    pa.auth_user_id,
    p.id as partner_id,
    p.company_name as partner_company_name
FROM partner_applications pa
LEFT JOIN partners p ON p.manager_auth_id = pa.auth_user_id
ORDER BY pa.created_at DESC
LIMIT 5;
