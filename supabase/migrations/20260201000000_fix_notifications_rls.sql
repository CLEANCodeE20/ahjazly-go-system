-- ==========================================================
-- NOTIFICATION SYSTEM RLS FIX (Gold Standard Alignment)
-- Date: 2026-02-01
-- Purpose: Fix RLS violation by ensuring auth_id exists and policies are correct.
-- ==========================================================

BEGIN;

-- 1. Ensure 'auth_id' exists in 'notifications' table and add missing professional fields
DO $$ 
BEGIN
    -- Add auth_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'auth_id') THEN
        ALTER TABLE public.notifications ADD COLUMN auth_id UUID REFERENCES auth.users(id);
    END IF;

    -- Add title
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'title') THEN
        ALTER TABLE public.notifications ADD COLUMN title VARCHAR(255);
    END IF;

    -- Add priority
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'priority') THEN
        ALTER TABLE public.notifications ADD COLUMN priority VARCHAR(20) DEFAULT 'medium';
    END IF;

    -- Add action_url
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'action_url') THEN
        ALTER TABLE public.notifications ADD COLUMN action_url TEXT;
    END IF;

    -- Add partner_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'partner_id') THEN
        ALTER TABLE public.notifications ADD COLUMN partner_id BIGINT REFERENCES public.partners(partner_id);
    END IF;

    -- Add metadata
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'metadata') THEN
        ALTER TABLE public.notifications ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 2. Backfill auth_id from users table if old_user_id exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'user_id') THEN
        UPDATE public.notifications n
        SET auth_id = u.auth_id
        FROM public.users u
        WHERE n.user_id = u.user_id 
        AND n.auth_id IS NULL;
        
        -- Mapping done, safely drop old column
        ALTER TABLE public.notifications DROP COLUMN user_id CASCADE;
    END IF;
END $$;

-- 3. Standardize Foreign Keys (Internal & Public)
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_auth_id_fkey;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_auth_id_fkey FOREIGN KEY (auth_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_auth_id_public_fkey;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_auth_id_public_fkey FOREIGN KEY (auth_id) REFERENCES public.users(auth_id) ON DELETE CASCADE;

-- 4. Rebuild Security Shield
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to avoid conflicts
DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.notifications', pol.policyname);
    END LOOP;
END $$;

-- Create Unified Access Policy
CREATE POLICY "Standard notification access" ON public.notifications
    FOR ALL USING (
        auth_id = auth.uid() 
        OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERUSER'
    )
    WITH CHECK (
        auth_id = auth.uid() 
        OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERUSER'
    );

-- 5. Special Grant for Authenticated Users
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

COMMIT;
