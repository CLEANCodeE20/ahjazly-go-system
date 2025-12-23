-- Create partner_applications table for tracking applications
CREATE TABLE public.partner_applications (
    application_id SERIAL PRIMARY KEY,
    -- Owner Info
    owner_name TEXT NOT NULL,
    owner_phone TEXT NOT NULL,
    owner_email TEXT NOT NULL,
    owner_id_number TEXT,
    -- Company Info
    company_name TEXT NOT NULL,
    company_email TEXT,
    company_phone TEXT,
    company_address TEXT,
    company_city TEXT NOT NULL,
    fleet_size INTEGER,
    -- Documents URLs
    commercial_register_url TEXT,
    tax_certificate_url TEXT,
    -- Additional
    description TEXT,
    -- Status tracking
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
    rejection_reason TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    -- Link to created partner after approval
    partner_id INTEGER REFERENCES public.partners(partner_id),
    auth_user_id UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (submit application)
CREATE POLICY "Anyone can submit application"
ON public.partner_applications
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Users can view their own application
CREATE POLICY "Users can view own application"
ON public.partner_applications
FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid());

-- Admins can view and manage all applications
CREATE POLICY "Admins can manage all applications"
ON public.partner_applications
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_partner_applications_updated_at
BEFORE UPDATE ON public.partner_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for partner documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('partner-documents', 'partner-documents', false);

-- Storage policies for partner documents
CREATE POLICY "Anyone can upload partner documents"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'partner-documents');

CREATE POLICY "Authenticated users can view their documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'partner-documents');

CREATE POLICY "Admins can manage all documents"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'partner-documents' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'partner-documents' AND public.has_role(auth.uid(), 'admin'));