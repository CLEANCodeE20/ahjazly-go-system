-- STAGE 5: Enhance Driver Documents Table
-- 1. Add missing columns
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'driver_documents' AND column_name = 'document_number') THEN
        ALTER TABLE public.driver_documents ADD COLUMN document_number VARCHAR(100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'driver_documents' AND column_name = 'auth_id') THEN
        ALTER TABLE public.driver_documents ADD COLUMN auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Make document_url nullable (to support legacy migrated data without files)
    ALTER TABLE public.driver_documents ALTER COLUMN document_url DROP NOT NULL;
END $$;

-- 2. Create FK to public.users for PostgREST
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'driver_documents_auth_id_public_fkey') THEN
        ALTER TABLE public.driver_documents ADD CONSTRAINT driver_documents_auth_id_public_fkey 
            FOREIGN KEY (auth_id) REFERENCES public.users(auth_id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Backfill: Map drivers' license data to driver_documents
-- This creates a professional record for every driver who has a license number but no document record yet
INSERT INTO public.driver_documents (driver_id, auth_id, document_type, document_number, expiry_date, verification_status, notes)
SELECT 
    d.driver_id, 
    d.auth_id, 
    'license', 
    d.license_number, 
    d.license_expiry, 
    'approved',
    'ترحيل تلقائي من بيانات السائق الأساسية'
FROM public.drivers d
WHERE d.license_number IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM public.driver_documents dd 
    WHERE dd.driver_id = d.driver_id AND dd.document_type = 'license'
)
ON CONFLICT DO NOTHING;

COMMENT ON COLUMN public.driver_documents.document_number IS 'رقم الوثيقة (مثل رقم الرخصة أو رقم الهوية)';
