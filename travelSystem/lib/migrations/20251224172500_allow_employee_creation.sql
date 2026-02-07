-- Allow Partners to create 'employee' users and roles.
-- Corrected version: app_role enum only supports 'employee', not specific job titles.

-- 1. Drop the incorrect policies if they were partially created (OR REPLACE doesn't exist for policies in the same way, so we drop first)
DROP POLICY IF EXISTS "Partners can insert employee users" ON public.users;
DROP POLICY IF EXISTS "Partners can assign employee roles" ON public.user_roles;

-- 2. Allow inserting into public.users if the new user is an employee
CREATE POLICY "Partners can insert employee users" ON public.users
FOR INSERT TO authenticated
WITH CHECK (
  user_type = 'employee' 
);

-- 3. Allow inserting into public.user_roles ONLY if the role is 'employee'
-- Specific job titles (driver, manager, etc.) are stored in the employees table, not here.
CREATE POLICY "Partners can assign employee roles" ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (
  role = 'employee' AND
  partner_id = (SELECT get_current_partner_id())
);
