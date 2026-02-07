-- =============================================
-- INITIALIZE DRIVER STORAGE & TABLE POLICIES (V2)
-- Purpose: Enable document uploads and fix 403 Forbidden errors on driver_documents.
-- =============================================

BEGIN;

-- 1. Initialize Storage Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('driver-documents', 'driver-documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Define Storage Bucket Policies
DROP POLICY IF EXISTS "Unified View Access for Driver Docs" ON storage.objects;
CREATE POLICY "Unified View Access for Driver Docs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'driver-documents');

DROP POLICY IF EXISTS "Partners can upload driver docs" ON storage.objects;
CREATE POLICY "Partners can upload driver docs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'driver-documents');

DROP POLICY IF EXISTS "Manage driver docs" ON storage.objects;
CREATE POLICY "Manage driver docs" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'driver-documents');

-- 3. Modernize driver_documents Table Policies (Fixing 403/RLS Error)
-- We must standardise these to use auth_id and role-based access.

ALTER TABLE public.driver_documents ENABLE ROW LEVEL SECURITY;

-- A. Clear old broken policies
DROP POLICY IF EXISTS "Drivers can view own documents" ON public.driver_documents;
DROP POLICY IF EXISTS "Drivers can upload documents" ON public.driver_documents;
DROP POLICY IF EXISTS "Partners can view drivers documents" ON public.driver_documents;

-- B. Create Gold Standard Policies
CREATE POLICY "Unified View Access to Driver Documents"
ON public.driver_documents FOR SELECT
TO authenticated
USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERUSER'
    OR auth_id = auth.uid()
    OR (
        (auth.jwt() -> 'app_metadata' ->> 'partner_id')::bigint = (
            SELECT partner_id FROM public.drivers WHERE driver_id = driver_documents.driver_id
        )
        AND (auth.jwt() -> 'app_metadata' ->> 'role') IN ('PARTNER_ADMIN', 'partner', 'manager', 'accountant', 'support', 'supervisor')
    )
);

CREATE POLICY "Unified Insert Access to Driver Documents"
ON public.driver_documents FOR INSERT
TO authenticated
WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERUSER'
    OR (
        -- Partners can insert for their own drivers
        (auth.jwt() -> 'app_metadata' ->> 'partner_id')::bigint = (
            SELECT partner_id FROM public.drivers WHERE driver_id = driver_documents.driver_id
        )
        AND (auth.jwt() -> 'app_metadata' ->> 'role') IN ('PARTNER_ADMIN', 'partner', 'manager')
    )
    OR (
        -- Drivers can insert for themselves
        EXISTS (SELECT 1 FROM public.drivers WHERE driver_id = driver_documents.driver_id AND auth_id = auth.uid())
    )
);

CREATE POLICY "Unified Full Access for Monitoring"
ON public.driver_documents FOR ALL
TO authenticated
USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERUSER'
    OR (
        (auth.jwt() -> 'app_metadata' ->> 'partner_id')::bigint = (
            SELECT partner_id FROM public.drivers WHERE driver_id = driver_documents.driver_id
        )
        AND (auth.jwt() -> 'app_metadata' ->> 'role') IN ('PARTNER_ADMIN', 'partner', 'manager')
    )
);

COMMIT;
