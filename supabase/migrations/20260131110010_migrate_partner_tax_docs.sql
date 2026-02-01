-- DATA MIGRATION: Partner Tax Certificates
-- This runs after the tax_certificate enum value has been committed.
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'partners') THEN
        INSERT INTO public.documents (partner_id, auth_id, document_type, document_url, verification_status)
        SELECT partner_id, manager_auth_id, 'tax_certificate'::public.document_type, tax_certificate_url, 'approved'::public.verification_status
        FROM public.partners
        WHERE tax_certificate_url IS NOT NULL
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
