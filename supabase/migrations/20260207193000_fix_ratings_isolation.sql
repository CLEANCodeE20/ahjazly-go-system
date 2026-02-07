-- =============================================
-- FIX RATINGS ISOLATION RLS
-- إصلاح عزل التقييمات - منع الشركاء من رؤية تقييمات شركات أخرى
-- =============================================

BEGIN;

-- 1. Drop the overly permissive public policy
DROP POLICY IF EXISTS "Public can view visible ratings" ON public.ratings;

-- 2. Create a smarter public policy
-- Everyone (anon/travelers) can still see visible ratings
-- BUT PARTNER_ADMIN should ONLY see their own (handled by another policy)
-- To avoid additive policy issues (OR), we make this one exclusive to non-partners or specific roles
CREATE POLICY "Public can view visible ratings"
ON public.ratings FOR SELECT
USING (
    is_visible = true 
    AND (
        -- Anonymous users (public site)
        auth.role() = 'anon'
        OR 
        -- Logged in travelers
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE auth_id = auth.uid() 
            AND role = 'TRAVELER'
        )
    )
);

-- 3. Ensure the partner policy is robust (already exists but just for reference/safety)
DROP POLICY IF EXISTS "Partners can view their ratings" ON public.ratings;
CREATE POLICY "Partners can view their ratings"
ON public.ratings FOR SELECT
USING (
    partner_id IN (
        SELECT partner_id FROM public.users WHERE auth_id = auth.uid()
    )
);

-- 4. Superusers should see everything
DROP POLICY IF EXISTS "Superusers can view all ratings" ON public.ratings;
CREATE POLICY "Superusers can view all ratings"
ON public.ratings FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE auth_id = auth.uid() 
        AND role = 'SUPERUSER'
    )
);

COMMIT;
