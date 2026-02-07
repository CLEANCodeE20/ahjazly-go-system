-- FIX: Add missing columns to partners table (Clean Version)
-- Removing owner_name/phone/email as they are redundant (handled by users table)
-- Only adding Company Details + Financial Details

ALTER TABLE public.partners 
ADD COLUMN IF NOT EXISTS commercial_registration VARCHAR(100),
ADD COLUMN IF NOT EXISTS tax_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS website VARCHAR(255),
ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS iban VARCHAR(100),
ADD COLUMN IF NOT EXISTS account_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS swift_code VARCHAR(50);
