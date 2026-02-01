-- FIX: Enable RLS on buses and add robust policies for Partners
-- Date: 2026-01-31

BEGIN;

-- 1. Enable RLS
ALTER TABLE public.buses ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Partners can view their own buses" ON public.buses;
DROP POLICY IF EXISTS "Partners can insert their own buses" ON public.buses;
DROP POLICY IF EXISTS "Partners can update their own buses" ON public.buses;
DROP POLICY IF EXISTS "Partners can delete their own buses" ON public.buses;
DROP POLICY IF EXISTS "Public can view active buses" ON public.buses;
DROP POLICY IF EXISTS "Admins can manage all buses" ON public.buses;

-- 3. Create Policy: Public View (Active buses only)
CREATE POLICY "Public can view active buses" ON public.buses
    FOR SELECT USING (status = 'active');

-- 4. Create Policy: SuperAdmin Management (All access)
CREATE POLICY "Admins can manage all buses" ON public.buses
    FOR ALL USING (
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERUSER'
    );

-- 5. Create Policy: Partner View (Own buses)
-- Uses auth.uid() to check against user_roles or implicit partnership
CREATE POLICY "Partners can view their own buses" ON public.buses
    FOR SELECT USING (
        partner_id IN (
            SELECT partner_id FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('PARTNER_ADMIN', 'manager', 'supervisor')
        )
    );

-- 6. Create Policy: Partner Insert
-- Must verify that the inserted partner_id matches the user's partner_id
CREATE POLICY "Partners can insert their own buses" ON public.buses
    FOR INSERT WITH CHECK (
        partner_id IN (
            SELECT partner_id FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('PARTNER_ADMIN', 'manager')
        )
    );

-- 7. Create Policy: Partner Update
CREATE POLICY "Partners can update their own buses" ON public.buses
    FOR UPDATE USING (
        partner_id IN (
            SELECT partner_id FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('PARTNER_ADMIN', 'manager', 'supervisor')
        )
    ) WITH CHECK (
        partner_id IN (
            SELECT partner_id FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('PARTNER_ADMIN', 'manager', 'supervisor')
        )
    );

-- 8. Create Policy: Partner Delete
CREATE POLICY "Partners can delete their own buses" ON public.buses
    FOR DELETE USING (
        partner_id IN (
            SELECT partner_id FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('PARTNER_ADMIN', 'manager')
        )
    );

COMMIT;
