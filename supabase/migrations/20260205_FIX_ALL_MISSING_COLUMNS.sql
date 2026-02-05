-- ========================================================
-- SUPER FIX: Add ALL Missing Columns to Database
-- Run this script in your Supabase SQL Editor to fix all 400 errors
-- ========================================================

-- 1. Fix 'partner_applications' table (Missing commercial_registration & tax_number)
DO $$ 
BEGIN
    -- Add commercial_registration
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'partner_applications' AND column_name = 'commercial_registration'
    ) THEN
        ALTER TABLE public.partner_applications ADD COLUMN commercial_registration VARCHAR(100);
    END IF;

    -- Add tax_number
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'partner_applications' AND column_name = 'tax_number'
    ) THEN
        ALTER TABLE public.partner_applications ADD COLUMN tax_number VARCHAR(50);
    END IF;
END $$;

-- 2. Fix 'partners' table (Missing bank details columns)
DO $$ 
BEGIN
    -- Add bank_name
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'partners' AND column_name = 'bank_name'
    ) THEN
        ALTER TABLE public.partners ADD COLUMN bank_name VARCHAR(100);
    END IF;

    -- Add iban
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'partners' AND column_name = 'iban'
    ) THEN
        ALTER TABLE public.partners ADD COLUMN iban VARCHAR(24);
    END IF;

    -- Add account_number
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'partners' AND column_name = 'account_number'
    ) THEN
        ALTER TABLE public.partners ADD COLUMN account_number VARCHAR(50);
    END IF;

    -- Add swift_code
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'partners' AND column_name = 'swift_code'
    ) THEN
        ALTER TABLE public.partners ADD COLUMN swift_code VARCHAR(11);
    END IF;
END $$;

-- 3. Add Constraints for Bank Details (Optional but recommended)
DO $$
BEGIN
    -- IBAN format check
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'partners_iban_format_check'
    ) THEN
        ALTER TABLE public.partners
        ADD CONSTRAINT partners_iban_format_check
        CHECK (iban IS NULL OR iban ~* '^SA[0-9]{22}$');
    END IF;
END $$;

-- 4. Verification Output
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE (table_name = 'partner_applications' AND column_name IN ('commercial_registration', 'tax_number'))
   OR (table_name = 'partners' AND column_name IN ('bank_name', 'iban'))
ORDER BY table_name, column_name;
