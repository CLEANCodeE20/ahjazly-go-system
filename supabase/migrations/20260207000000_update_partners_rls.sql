-- ========================================================
-- UPDATE PARTNERS SCHEMA AND RLS POLICIES
-- Adds missing columns used in SettingsPage and fixes RLS
-- ========================================================

-- 1. Add missing columns if they don't exist
ALTER TABLE public.partners 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS commercial_register_url TEXT,
ADD COLUMN IF NOT EXISTS tax_certificate_url TEXT,
ADD COLUMN IF NOT EXISTS commercial_registration VARCHAR(100),
ADD COLUMN IF NOT EXISTS tax_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS website VARCHAR(255),
ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS iban VARCHAR(100),
ADD COLUMN IF NOT EXISTS account_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS swift_code VARCHAR(50);

-- 2. Drop the restrictive update policy
DROP POLICY IF EXISTS "Admins and owners can update partners" ON public.partners;

-- 3. Create the enhanced UPDATE Policy
-- Admins (SUPERUSER, ADMIN) can update any partner
-- Partners (PARTNER_ADMIN, manager) can update their own data
CREATE POLICY "Admins and partners can update own data"
ON public.partners
FOR UPDATE
TO authenticated
USING (
  (auth.uid()::text = manager_auth_id::text)
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE public.user_roles.auth_id = auth.uid() 
    AND (
      public.user_roles.role IN ('SUPERUSER', 'ADMIN')
      OR 
      (public.user_roles.role IN ('PARTNER_ADMIN', 'manager') AND public.user_roles.partner_id = public.partners.partner_id)
    )
  )
)
WITH CHECK (
  (auth.uid()::text = manager_auth_id::text)
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE public.user_roles.auth_id = auth.uid() 
    AND (
      public.user_roles.role IN ('SUPERUSER', 'ADMIN')
      OR 
      (public.user_roles.role IN ('PARTNER_ADMIN', 'manager') AND public.user_roles.partner_id = public.partners.partner_id)
    )
  )
);

-- Documentation
COMMENT ON COLUMN public.partners.logo_url IS 'Public URL for the partner company logo';
COMMENT ON COLUMN public.partners.commercial_register_url IS 'Public URL for the commercial registration document';
COMMENT ON COLUMN public.partners.tax_certificate_url IS 'Public URL for the tax/VAT certificate document';
