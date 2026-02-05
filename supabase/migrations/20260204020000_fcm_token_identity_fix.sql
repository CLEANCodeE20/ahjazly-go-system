-- Add unique constraint for auth_id and fcm_token in user_device_tokens
-- This ensures that UPSERT operations from the mobile app work correctly 
-- with the new UUID (auth_id) system.

BEGIN;

DO $$ 
BEGIN
    -- 1. Remove any old legacy constraints that might have been renamed or left behind
    ALTER TABLE public.user_device_tokens DROP CONSTRAINT IF EXISTS user_device_tokens_user_id_fcm_token_key;
    
    -- 2. Add the new Gold Standard unique constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_device_tokens_auth_id_fcm_token_key'
    ) THEN
        ALTER TABLE public.user_device_tokens
        ADD CONSTRAINT user_device_tokens_auth_id_fcm_token_key UNIQUE (auth_id, fcm_token);
    END IF;
END $$;

COMMIT;
