-- Allow partners to view user roles associated with their partner_id
-- This fixes the issue where inserting a role fails (or appears to fail) because the partner cannot see the new row.

CREATE POLICY "Partners can view employee roles" ON public.user_roles
FOR SELECT TO authenticated
USING (
  partner_id = (SELECT get_current_partner_id())
);

-- Also ensure the INSERT policy is robust (re-applying or verifying isn't needed if previous one was correct, 
-- but we can ensure it exists and covers the case). 
-- Previous policy "Partners can assign employee roles" checks: role='employee' AND partner_id = get_current_partner_id()
-- That should be fine.
