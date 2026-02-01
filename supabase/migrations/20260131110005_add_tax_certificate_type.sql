-- ENUM ENHANCEMENT: Add tax_certificate to document_type
-- This must be in its own migration to be committed before usage.
ALTER TYPE public.document_type ADD VALUE IF NOT EXISTS 'tax_certificate';
