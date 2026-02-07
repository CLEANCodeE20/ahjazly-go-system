-- EMERGENCY FIX FOR LOGIN ISSUES
-- This script relaxes RLS policies to ensure the frontend can fetch user profiles.

-- 1. Unblock public.users table (Profile data)
-- Ensure 'account_status' is valid for all users
UPDATE public.users SET account_status = 'active' WHERE account_status IS NULL;

-- Drop existing SELECT policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Anyone can view users" ON public.users;
DROP POLICY IF EXISTS "Authenticated can view profile" ON public.users;

-- Create a simplified policy: ANY authenticated user can read their own profile
CREATE POLICY "Authenticated can view own profile" 
ON public.users 
FOR SELECT 
TO authenticated 
USING ( auth.uid() = auth_id );

-- 2. Unblock public.user_roles table (Role data)
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;

CREATE POLICY "Users can view their own role" 
ON public.user_roles 
FOR SELECT 
TO authenticated 
USING ( user_id = auth.uid() );

-- 3. Unblock public.partners table (For company dashboard)
DROP POLICY IF EXISTS "Startups/Partners can view own data" ON public.partners;

CREATE POLICY "Startups/Partners can view own data" 
ON public.partners 
FOR SELECT 
TO authenticated 
USING ( 
    partner_id IN (
        SELECT partner_id FROM public.user_roles WHERE user_id = auth.uid()
    )
);

-- 4. Ensure Trigger exists for new signups
-- If the user creates a new account, we MUST ensure the public.users record is created.
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_id, full_name, email, user_type, account_status)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email, 'customer', 'active')
  ON CONFLICT (auth_id) DO UPDATE
  SET email = new.email;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach trigger (drop first to be safe)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

