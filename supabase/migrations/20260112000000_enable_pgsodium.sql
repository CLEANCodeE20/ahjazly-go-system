-- Enable pgsodium extension
CREATE EXTENSION IF NOT EXISTS pgsodium;

-- Create a schema for security internal objects if not exists
CREATE SCHEMA IF NOT EXISTS security;

-- Comment: This migration enables the foundations for Transparent Column Encryption (TCE).
-- To fully implement encryption for existing tables (e.g., users), 
-- you will need to define security labels for the columns you want to encrypt.

-- Example for users table:
-- SECURITY LABEL FOR pgsodium ON COLUMN public.users.phone_number IS 'encrypt with key_id ...';

-- Note: Key management should be handled carefully via Supabase Vault.
