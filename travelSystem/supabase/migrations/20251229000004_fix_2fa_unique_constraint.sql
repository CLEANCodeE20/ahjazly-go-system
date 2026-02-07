-- Ensure unique constraint on auth_id for user_two_factor table
-- Needed for upsert (ON CONFLICT) operations in Edge Functions

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_two_factor_auth_id_key'
    ) THEN
        ALTER TABLE public.user_two_factor ADD CONSTRAINT user_two_factor_auth_id_key UNIQUE (auth_id);
    END IF;
END $$;
