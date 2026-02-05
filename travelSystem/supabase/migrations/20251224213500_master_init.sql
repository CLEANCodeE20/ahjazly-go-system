-- MASTER SYSTEM INITIALIZATION & STABILIZATION SCRIPT
-- RUN THIS SCRIPT TO FIX ALL LOGIN AND PERMISSION ISSUES
-- =======================================================

BEGIN;

-- 1. SCHEMA STABILIZATION
-- Ensure users table has all required columns with correct defaults
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS user_type text DEFAULT 'customer',
ADD COLUMN IF NOT EXISTS account_status text DEFAULT 'active';

-- Ensure user_roles table exists
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    role VARCHAR(50) NOT NULL, -- 'admin', 'partner', 'employee', 'customer'
    partner_id INT
);

-- 2. DATA CLEANUP
-- Fix any inconsistent user states
UPDATE public.users SET account_status = 'active' WHERE account_status IS NULL;
UPDATE public.users SET user_type = 'customer' WHERE user_type IS NULL;

-- 3. RESET RLS POLICIES (Clean Slate)
-- Drop all existing policies SAFELY
DO $$ 
BEGIN
    -- users policies
    DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
    DROP POLICY IF EXISTS "Anyone can view users" ON public.users;
    DROP POLICY IF EXISTS "Authenticated can view profile" ON public.users;
    DROP POLICY IF EXISTS "Authenticated can view own profile" ON public.users;
    DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
    DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
    DROP POLICY IF EXISTS "Users can insert own profile" ON public.users; 

    -- user_roles policies
    DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
    DROP POLICY IF EXISTS "Public read access for user_roles" ON public.user_roles;

    -- partners policies
    DROP POLICY IF EXISTS "Startups/Partners can view own data" ON public.partners;
    DROP POLICY IF EXISTS "Public read access for partners" ON public.partners;
    DROP POLICY IF EXISTS "Partners can view own company" ON public.partners;
END $$;

-- 4. APPLY "GOLDEN PATH" POLICIES
-- Trusted, minimal policies for correct operation.

-- Policy: Users can read their own profile
CREATE POLICY "Users can view own profile" 
ON public.users FOR SELECT 
TO authenticated 
USING ( auth.uid() = auth_id );

-- Policy: Users can update their own profile (e.g. name, phone)
CREATE POLICY "Users can update own profile" 
ON public.users FOR UPDATE
TO authenticated 
USING ( auth.uid() = auth_id );

-- Policy: Users can insert their own profile (Critical for Signup flow)
CREATE POLICY "Users can insert own profile" 
ON public.users FOR INSERT 
TO authenticated 
WITH CHECK ( auth.uid() = auth_id );

-- Policy: Users can read their own role (Critical for Login redirection)
CREATE POLICY "Users can view own role" 
ON public.user_roles FOR SELECT 
TO authenticated 
USING ( user_id = auth.uid() );

-- Policy: Partners can read their own company data
CREATE POLICY "Partners can view own company" 
ON public.partners FOR SELECT 
TO authenticated 
USING ( 
    partner_id IN (
        SELECT partner_id FROM public.user_roles WHERE user_id = auth.uid()
    )
    OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- 5. AUTO-ADMIN TRIGGER (The "Perfect Signup" Logic)
-- Automatically promotes users with specific email domains to Admin.

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
    is_admin BOOLEAN;
    calculated_role TEXT;
BEGIN
    -- Determine role based on email pattern
    is_admin := (new.email LIKE '%@admin.com') OR (new.email LIKE '%@ahjazly.com');
    calculated_role := CASE WHEN is_admin THEN 'admin' ELSE 'customer' END;

    -- 1. Create Public Profile
    INSERT INTO public.users (
        auth_id, 
        full_name, 
        email, 
        user_type, 
        account_status
    )
    VALUES (
        new.id, 
        COALESCE(new.raw_user_meta_data->>'full_name', 'New User'), 
        new.email, 
        calculated_role::user_type, 
        'active'
    )
    ON CONFLICT (auth_id) DO UPDATE
    SET 
        email = new.email,
        user_type = calculated_role::user_type;

    -- 2. Assign Role in user_roles
    INSERT INTO public.user_roles (user_id, role, partner_id)
    VALUES (
        new.id, 
        calculated_role, 
        NULL
    )
    ON CONFLICT (user_id) DO UPDATE
    SET role = calculated_role;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-bind trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

COMMIT;
