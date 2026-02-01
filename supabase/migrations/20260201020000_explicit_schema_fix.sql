-- ==========================================================
-- EMERGENCY SCHEMA ALIGNMENT FIX (Explicit Public Schema)
-- Purpose: Resolve 400 Bad Request by ensuring columns exist IN PUBLIC SCHEMA.
-- ==========================================================

DO $$ 
BEGIN
    -- Ensure columns exist SPECIFICALLY in the 'public' schema
    -- This prevents shadowing logic if 'notifications' exists in 'auth' or other schemas.

    -- 1. auth_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'auth_id') THEN
        ALTER TABLE public.notifications ADD COLUMN auth_id UUID REFERENCES auth.users(id);
    END IF;

    -- 2. title
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'title') THEN
        ALTER TABLE public.notifications ADD COLUMN title VARCHAR(255);
    END IF;

    -- 3. priority
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'priority') THEN
        ALTER TABLE public.notifications ADD COLUMN priority VARCHAR(20) DEFAULT 'medium';
    END IF;

    -- 4. action_url
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'action_url') THEN
        ALTER TABLE public.notifications ADD COLUMN action_url TEXT;
    END IF;

    -- 5. partner_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'partner_id') THEN
        ALTER TABLE public.notifications ADD COLUMN partner_id BIGINT REFERENCES public.partners(partner_id);
    END IF;

    -- 6. metadata
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'metadata') THEN
        ALTER TABLE public.notifications ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;

END $$;

-- 2. Force Permissions Refresh
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
GRANT ALL ON public.notifications TO anon;

-- 3. Ensure RLS is correctly applied to the PUBLIC table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Standard notification access" ON public.notifications;

CREATE POLICY "Standard notification access" ON public.notifications
    FOR ALL USING (
        auth_id = auth.uid() 
        OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERUSER'
    )
    WITH CHECK (
        auth_id = auth.uid() 
        OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERUSER'
    );
