-- SYNC PARTNER IDs from user_roles to users
-- The storage RLS policy checks public.users.partner_id, so this must be populated.

UPDATE public.users u
SET partner_id = ur.partner_id
FROM public.user_roles ur
WHERE u.auth_id = ur.auth_id
  AND u.partner_id IS DISTINCT FROM ur.partner_id
  AND ur.partner_id IS NOT NULL;
