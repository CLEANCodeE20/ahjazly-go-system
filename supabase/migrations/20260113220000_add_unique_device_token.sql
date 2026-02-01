-- Add unique constraint to user_device_tokens to prevent duplicates
-- This allows UPSERT to work correctly based on user_id and fcm_token

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_device_tokens_user_id_fcm_token_key'
    ) THEN
        ALTER TABLE public.user_device_tokens
        ADD CONSTRAINT user_device_tokens_user_id_fcm_token_key UNIQUE (user_id, fcm_token);
    END IF;
END $$;
