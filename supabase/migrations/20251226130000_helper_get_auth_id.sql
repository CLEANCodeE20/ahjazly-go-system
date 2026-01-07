-- Helper function to get auth_id by email securely
-- Used by Edge Functions to adopt orphan users
-- Run this in your Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.get_auth_id_by_email(email_input text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  found_id uuid;
BEGIN
  SELECT id INTO found_id FROM auth.users WHERE email = email_input;
  RETURN found_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_auth_id_by_email(text) TO service_role;
