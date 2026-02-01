-- STAGE 4: Centralize Driver Documents
-- 1. Add driver_id to the main documents table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'driver_id') THEN
        ALTER TABLE public.documents ADD COLUMN driver_id BIGINT REFERENCES public.drivers(driver_id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Migrate data from old driver_documents to central documents table
-- We map categories to match the new enum values
INSERT INTO public.documents (
    driver_id, 
    document_type, 
    document_url, 
    expiry_date, 
    verification_status, 
    created_at
)
SELECT 
    driver_id, 
    document_type::public.document_type, 
    document_url, 
    expiry_date, 
    verification_status::public.verification_status, 
    uploaded_at
FROM public.driver_documents
ON CONFLICT DO NOTHING;

-- 3. Note: We keep driver_documents for now for safety, but eventually it can be dropped.
COMMENT ON COLUMN public.documents.driver_id IS 'رابط الوثيقة بالسائق في حال كانت وثيقة شخصية/مهنية للسائق';
