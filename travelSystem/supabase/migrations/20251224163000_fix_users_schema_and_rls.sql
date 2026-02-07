-- 1. Fix public.users schema
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS user_type text DEFAULT 'customer',
ADD COLUMN IF NOT EXISTS account_status text DEFAULT 'active';

-- Fix column name mismatch (if any)
DO $$ 
BEGIN
  -- Use EXECUTE to avoid parser error if column doesn't exist
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'phone') THEN
    EXECUTE 'ALTER TABLE public.users RENAME COLUMN phone TO phone_number';
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'phone_number') THEN
    ALTER TABLE public.users ADD COLUMN phone_number character varying;
  END IF;
END $$;

-- 2. Restore missing RLS policies for user_roles (User needs to see their own role to login)
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 3. Ensure users can insert their own profile during registration (Apply flow)
-- The Apply.tsx insert happens when user is authenticated (post-signup)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth_id = auth.uid());

-- 4. Update the combined security script to be more robust
-- (This is just a patch, next step is to update the main script if needed)
