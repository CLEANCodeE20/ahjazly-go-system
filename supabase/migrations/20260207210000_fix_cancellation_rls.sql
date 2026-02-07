-- ========================================================
-- FIX CANCELLATION POLICIES RLS (403 Forbidden)
-- ========================================================

BEGIN;

-- 1. Ensure get_current_partner_id() is distinct and working
-- (It's already defined correctly in previous migrations, but we ensure it's accessible)
GRANT EXECUTE ON FUNCTION public.get_current_partner_id() TO authenticated;

-- 2. Relax cancel_policies RLS to allow SELECT by authenticated users
-- This is often needed for the frontend to list policies before editing rules
DROP POLICY IF EXISTS "Partners manage rules for own policies" ON public.cancel_policy_rules;
DROP POLICY IF EXISTS "Partners can manage their own cancel_policies" ON public.cancel_policies;
DROP POLICY IF EXISTS "Public read access for cancel_policies" ON public.cancel_policies;

-- A. Policies for cancel_policies (Parent Table)
-- Allow read access to all authenticated users (simplifies frontend logic)
CREATE POLICY "Authenticated users can view cancel_policies"
ON public.cancel_policies FOR SELECT TO authenticated
USING (true);

-- Allow partners to insert/update/delete their own policies
CREATE POLICY "Partners can manage their own cancel_policies"
ON public.cancel_policies FOR ALL TO authenticated
USING (partner_id = (auth.jwt() -> 'app_metadata' ->> 'partner_id')::BIGINT)
WITH CHECK (partner_id = (auth.jwt() -> 'app_metadata' ->> 'partner_id')::BIGINT);

-- Allow public read for active policies (for booking flow)
CREATE POLICY "Public read active cancel_policies"
ON public.cancel_policies FOR SELECT TO anon
USING (is_active = true);


-- B. Policies for cancel_policy_rules (Child Table)
-- Allow read access to all authenticated users
CREATE POLICY "Authenticated users can view cancel_policy_rules"
ON public.cancel_policy_rules FOR SELECT TO authenticated
USING (true);

-- Allow partners to manage rules for their own policies
-- We use a direct EXISTS clause which is often more robust than IN (...)
CREATE POLICY "Partners can manage rules for own policies"
ON public.cancel_policy_rules FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.cancel_policies cp
        WHERE cp.cancel_policy_id = cancel_policy_rules.cancel_policy_id
        AND cp.partner_id = (auth.jwt() -> 'app_metadata' ->> 'partner_id')::BIGINT
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.cancel_policies cp
        WHERE cp.cancel_policy_id = cancel_policy_rules.cancel_policy_id
        AND cp.partner_id = (auth.jwt() -> 'app_metadata' ->> 'partner_id')::BIGINT
    )
);

-- Allow public read for rules of active policies
CREATE POLICY "Public read active cancel_policy_rules"
ON public.cancel_policy_rules FOR SELECT TO anon
USING (
    EXISTS (
        SELECT 1 FROM public.cancel_policies cp
        WHERE cp.cancel_policy_id = cancel_policy_rules.cancel_policy_id
        AND cp.is_active = true
    )
);

COMMIT;
