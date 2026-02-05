-- Create Policies Table
CREATE TYPE policy_type AS ENUM ('internal', 'public', 'terms', 'privacy');
CREATE TYPE policy_status AS ENUM ('active', 'draft', 'archived');

CREATE TABLE IF NOT EXISTS public.policies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL, -- Supports HTML/Markdown
    type policy_type NOT NULL DEFAULT 'internal',
    status policy_status NOT NULL DEFAULT 'draft',
    version VARCHAR(20) DEFAULT '1.0',
    effective_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;

-- Policies for 'policies' table

-- 1. View Policies:
--    - 'public', 'terms', 'privacy' -> Visible to everyone (even anon if needed for terms page)
--    - 'internal' -> Visible to authenticated users (employees/partners/admins)
CREATE POLICY "Public policies are viewable by everyone" 
ON public.policies FOR SELECT 
USING (
    type IN ('public', 'terms', 'privacy') AND status = 'active'
);

CREATE POLICY "Internal policies are viewable by authenticated users" 
ON public.policies FOR SELECT 
TO authenticated 
USING (
    true -- Authenticated users can see all policies, or filter by internal if strictly needed. 
         -- Simplification: Auth users can see all active policies.
         -- If we want to hide 'drafts' from non-admins:
    AND (
        status = 'active' OR 
        (status IN ('draft', 'archived') AND public.has_role(auth.uid(), 'admin'))
    )
);

-- 2. Manage Policies (Insert/Update/Delete):
--    - Only Admins can manage policies
CREATE POLICY "Admins can manage policies" 
ON public.policies FOR ALL 
TO authenticated 
USING (
    public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
    public.has_role(auth.uid(), 'admin')
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_policies_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_policies_timestamp
BEFORE UPDATE ON public.policies
FOR EACH ROW
EXECUTE FUNCTION update_policies_timestamp();
