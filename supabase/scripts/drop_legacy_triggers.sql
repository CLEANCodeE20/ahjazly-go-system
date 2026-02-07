-- SAFE CLEANUP: Drop legacy triggers that reference 'user_type'

-- 1. Drop trigger on auth.users (if exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Drop the function associated with it
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Verify user_roles policies (ensure they don't reference user_type)
-- (No action needed, policies were updated in previous migrations)

-- 4. Ensure public.users does NOT have user_type column
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'user_type') THEN
        ALTER TABLE public.users DROP COLUMN user_type;
    END IF;
END $$;
