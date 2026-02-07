-- Fix Driver Relationships (Standardize to Gold Standard)
-- Purpose: Enable PostgREST joins by formalizing the link between drivers and users.

BEGIN;

-- 1. Ensure foreign key from drivers(auth_id) to users(auth_id)
-- First, ensure any existing constraint is removed to prevent naming conflicts
ALTER TABLE public.drivers DROP CONSTRAINT IF EXISTS drivers_auth_id_fkey;

-- Add the foreign key to public.users(auth_id)
-- This allows (.select('*, users(...)')) joins in Supabase client
ALTER TABLE public.drivers
ADD CONSTRAINT drivers_auth_id_fkey
FOREIGN KEY (auth_id)
REFERENCES public.users(auth_id)
ON DELETE CASCADE;

-- 2. Add foreign key from driver_documents to drivers
-- Ensuring documents are correctly linked
ALTER TABLE public.driver_documents DROP CONSTRAINT IF EXISTS driver_documents_driver_id_fkey;

ALTER TABLE public.driver_documents
ADD CONSTRAINT driver_documents_driver_id_fkey
FOREIGN KEY (driver_id)
REFERENCES public.drivers(driver_id)
ON DELETE CASCADE;

COMMIT;
