-- ========================================================
-- Add Missing Columns to Partner Applications Table
-- ========================================================

-- Add commercial_registration column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'partner_applications' AND column_name = 'commercial_registration'
    ) THEN
        ALTER TABLE public.partner_applications ADD COLUMN commercial_registration VARCHAR(100);
    END IF;
END $$;

-- Add tax_number column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'partner_applications' AND column_name = 'tax_number'
    ) THEN
        ALTER TABLE public.partner_applications ADD COLUMN tax_number VARCHAR(50);
    END IF;
END $$;

-- Verify the columns were added
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'partner_applications'
AND column_name IN ('commercial_registration', 'tax_number')
ORDER BY column_name;
