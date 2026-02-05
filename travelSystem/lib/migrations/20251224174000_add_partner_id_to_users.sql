-- Add partner_id to users table to link employees to partners
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'partner_id') THEN
        ALTER TABLE public.users ADD COLUMN partner_id INTEGER REFERENCES public.partners(partner_id) ON DELETE SET NULL;
    END IF;
END $$;

-- Update RLS for users table
-- Allow partners to view their own employees
CREATE POLICY "Partners can view own employees" ON public.users
FOR SELECT TO authenticated
USING (
  partner_id = (SELECT get_current_partner_id()) 
  AND user_type = 'employee'
);

-- Update Insert policy to include partner_id check
DROP POLICY IF EXISTS "Partners can insert employee users" ON public.users;
CREATE POLICY "Partners can insert employee users" ON public.users
FOR INSERT TO authenticated
WITH CHECK (
  user_type = 'employee' AND
  partner_id = (SELECT get_current_partner_id())
);

-- Update Update policy (optional, but good)
CREATE POLICY "Partners can update own employees" ON public.users
FOR UPDATE TO authenticated
USING (
  partner_id = (SELECT get_current_partner_id()) 
  AND user_type = 'employee'
)
WITH CHECK (
  partner_id = (SELECT get_current_partner_id()) 
  AND user_type = 'employee'
);
