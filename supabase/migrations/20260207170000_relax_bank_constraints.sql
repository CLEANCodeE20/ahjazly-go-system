-- Relax Bank Details Constraints for Yemeni Market Compatibility
-- This migration drops strict SA IBAN and SWIFT checks to support local banks like Al-Kuraimi.

BEGIN;

-- 1. Drop the strict Saudi IBAN format check
ALTER TABLE public.partners 
DROP CONSTRAINT IF EXISTS partners_iban_format_check;

-- 2. Drop the strict SWIFT code check (optional, but good for flexibility)
ALTER TABLE public.partners 
DROP CONSTRAINT IF EXISTS partners_swift_code_format_check;

-- 3. Ensure columns are flexible enough
-- (They are already VARCHAR, but ensuring they accept NULLs or varied lengths is good practice)
-- IBAN was VARCHAR(24), we should increase it just in case non-standard formats are longer
ALTER TABLE public.partners 
ALTER COLUMN iban TYPE VARCHAR(50);

-- Account number was VARCHAR(50), which is fine.

COMMIT;
