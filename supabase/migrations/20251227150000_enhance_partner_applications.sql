-- Add missing fields to partner_applications to match the enhanced partners table
ALTER TABLE public.partner_applications 
ADD COLUMN IF NOT EXISTS commercial_registration TEXT,
ADD COLUMN IF NOT EXISTS tax_number TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS iban TEXT,
ADD COLUMN IF NOT EXISTS account_number TEXT,
ADD COLUMN IF NOT EXISTS swift_code TEXT;

-- Update RLS if needed (already set to anyone can insert)
