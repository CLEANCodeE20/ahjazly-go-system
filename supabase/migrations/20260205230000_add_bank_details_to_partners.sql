-- ========================================================
-- Add Bank Details Columns to Partners Table
-- ========================================================

-- Add bank_name column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'partners' AND column_name = 'bank_name'
    ) THEN
        ALTER TABLE public.partners ADD COLUMN bank_name VARCHAR(100);
    END IF;
END $$;

-- Add iban column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'partners' AND column_name = 'iban'
    ) THEN
        ALTER TABLE public.partners ADD COLUMN iban VARCHAR(24);
    END IF;
END $$;

-- Add account_number column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'partners' AND column_name = 'account_number'
    ) THEN
        ALTER TABLE public.partners ADD COLUMN account_number VARCHAR(50);
    END IF;
END $$;

-- Add swift_code column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'partners' AND column_name = 'swift_code'
    ) THEN
        ALTER TABLE public.partners ADD COLUMN swift_code VARCHAR(11);
    END IF;
END $$;

-- Add check constraint for IBAN format (Saudi Arabia)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'partners_iban_format_check'
    ) THEN
        ALTER TABLE public.partners
        ADD CONSTRAINT partners_iban_format_check
        CHECK (iban IS NULL OR iban ~* '^SA[0-9]{22}$');
    END IF;
END $$;

-- Add check constraint for SWIFT code format
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'partners_swift_code_format_check'
    ) THEN
        ALTER TABLE public.partners
        ADD CONSTRAINT partners_swift_code_format_check
        CHECK (swift_code IS NULL OR swift_code ~* '^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$');
    END IF;
END $$;

-- Verify the columns were added
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'partners'
AND column_name IN ('bank_name', 'iban', 'account_number', 'swift_code')
ORDER BY column_name;
