-- Ensure storage bucket exists for partner documents
-- This fixes the "Bucket not found" 404 error

INSERT INTO storage.buckets (id, name, public)
VALUES ('partner-documents', 'partner-documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Ensure storage policies for partner documents are correct
-- Allow anyone to upload (for the application form)
DROP POLICY IF EXISTS "Anyone can upload partner documents" ON storage.objects;
CREATE POLICY "Anyone can upload partner documents"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'partner-documents');

-- Allow authenticated users to view
DROP POLICY IF EXISTS "Authenticated users can view partner documents" ON storage.objects;
CREATE POLICY "Authenticated users can view partner documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'partner-documents');

-- Allow admins full control
DROP POLICY IF EXISTS "Admins can manage partner documents" ON storage.objects;
CREATE POLICY "Admins can manage partner documents"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'partner-documents' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'partner-documents' AND public.has_role(auth.uid(), 'admin'));
