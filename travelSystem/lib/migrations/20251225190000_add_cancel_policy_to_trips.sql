-- Add cancel_policy_id to trips table
ALTER TABLE public.trips 
ADD COLUMN cancel_policy_id BIGINT REFERENCES public.cancel_policies(cancel_policy_id) ON DELETE SET NULL;

-- Enable RLS for the new column if needed (usually handled by table-level RLS)
