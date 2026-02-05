-- ==========================================================
-- EMERGENCY FIX: ADD MISSING COLUMNS & UNIFY OPERATIONS
-- Date: 2026-02-02
-- Purpose: Fix "column users.user_type does not exist" and apply unification
-- ==========================================================

BEGIN;

-- 1. FIX MISSING TYPES & COLUMNS
-- ==========================================================

-- Ensure user_type ENUM exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_type') THEN
        CREATE TYPE public.user_type AS ENUM ('customer', 'partner', 'admin', 'driver', 'employee');
    END IF;
END $$;

-- Ensure users table has user_type
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS user_type public.user_type DEFAULT 'customer';

-- Ensure users table has account_status
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_status') THEN
        CREATE TYPE public.account_status AS ENUM ('active', 'inactive', 'suspended', 'pending');
    END IF;
END $$;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS account_status public.account_status DEFAULT 'active';

-- Ensure other critical columns refer to auth_id
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_auth_id_key CASCADE;
ALTER TABLE public.users ADD CONSTRAINT users_auth_id_key UNIQUE (auth_id);


-- 2. APPLY UNIFIED FUNCTIONS (From 20260201060000_total_operations_unification.sql)
-- ==========================================================

-- A. has_role()
CREATE OR REPLACE FUNCTION public.has_role(p_user_id UUID, p_role_name TEXT)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE auth_id = p_user_id AND (role::text = p_role_name OR role::text = 'SUPERUSER')
  );
$$;

-- B. get_user_role()
CREATE OR REPLACE FUNCTION public.get_user_role(p_auth_id UUID)
RETURNS TEXT LANGUAGE SQL STABLE AS $$
  SELECT role::TEXT FROM public.user_roles WHERE auth_id = p_auth_id LIMIT 1;
$$;

-- C. Fix user_roles foreign key to point to auth_id
DO $$ 
BEGIN 
    -- Drop old constraints if they exist
    ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_auth_id_public_fkey;
    ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;
    
    -- Check if auth_id column exists in user_roles
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_roles' AND column_name = 'auth_id') THEN
        ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_auth_id_public_fkey FOREIGN KEY (auth_id) REFERENCES public.users(auth_id) ON DELETE CASCADE;
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_roles' AND column_name = 'user_id') THEN
        -- If it's still user_id but holds UUIDs
        ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_auth_id_public_fkey FOREIGN KEY (user_id) REFERENCES public.users(auth_id) ON DELETE CASCADE;
    END IF;
END $$;


-- 3. FIX RLS FOR USERS (Unlock access)
-- ==========================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Global View Access" ON public.users;
CREATE POLICY "Global View Access" ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own data" ON public.users;
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid() = auth_id);


COMMIT;
