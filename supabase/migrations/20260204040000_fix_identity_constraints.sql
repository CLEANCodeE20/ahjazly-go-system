-- =============================================
-- FIX CONFLICT CONSTRAINTS FOR IDENTITY SYNC
-- Date: 2026-02-04
-- Purpose: Add unique constraints to auth_id in users and drivers tables
--          to support ON CONFLICT operations in identity RPCs.
-- =============================================

BEGIN;

-- 1. Ensure unique constraint on public.users(auth_id)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'users' AND constraint_type = 'UNIQUE' 
        AND constraint_name = 'users_auth_id_key'
    ) THEN
        ALTER TABLE public.users ADD CONSTRAINT users_auth_id_key UNIQUE (auth_id);
    END IF;
END $$;

-- 2. Ensure unique constraint on public.drivers(auth_id)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'drivers' AND constraint_type = 'UNIQUE' 
        AND constraint_name = 'drivers_auth_id_key'
    ) THEN
        ALTER TABLE public.drivers ADD CONSTRAINT drivers_auth_id_key UNIQUE (auth_id);
    END IF;
END $$;

-- 3. Ensure unique constraint on public.employees(auth_id)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'employees' AND constraint_type = 'UNIQUE' 
        AND constraint_name = 'employees_auth_id_key'
    ) THEN
        ALTER TABLE public.employees ADD CONSTRAINT employees_auth_id_key UNIQUE (auth_id);
    END IF;
END $$;

COMMIT;
