-- Add comprehensive profile fields to partners table
ALTER TABLE public.partners 
ADD COLUMN IF NOT EXISTS commercial_registration VARCHAR(100),
ADD COLUMN IF NOT EXISTS tax_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS website VARCHAR(255),
ADD COLUMN IF NOT EXISTS logo_url TEXT,

-- Owner Information
ADD COLUMN IF NOT EXISTS owner_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS owner_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS owner_email VARCHAR(255),

-- Financial Information
ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS iban VARCHAR(100),
ADD COLUMN IF NOT EXISTS account_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS swift_code VARCHAR(50);

-- Refresh the valid_partners view or any dependent views if they strictly define columns (Postgres views usually need recreation if using SELECT *, but ideally views specify columns)
-- Just in case, adding a comment to document changes
COMMENT ON COLUMN public.partners.commercial_registration IS 'Commercial Registration Number (Sijil)';
COMMENT ON COLUMN public.partners.tax_number IS 'VAT or Tax Identification Number';
