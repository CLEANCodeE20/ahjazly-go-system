-- ========================================================
-- CANCELLATION POLICIES SECURITY & OPERATIONS FIX
-- ========================================================

-- 1. Ensure RLS for cancel_policy_rules (Join with cancel_policies)
DROP POLICY IF EXISTS "Partners manage rules for own policies" ON public.cancel_policy_rules;
CREATE POLICY "Partners manage rules for own policies" ON public.cancel_policy_rules
FOR ALL TO authenticated
USING (
    cancel_policy_id IN (
        SELECT cancel_policy_id 
        FROM public.cancel_policies 
        WHERE partner_id = get_current_partner_id()
    )
)
WITH CHECK (
    cancel_policy_id IN (
        SELECT cancel_policy_id 
        FROM public.cancel_policies 
        WHERE partner_id = get_current_partner_id()
    )
);

-- 2. Ensure Public can view active rules (Necessary for booking display)
DROP POLICY IF EXISTS "Public can view active rules" ON public.cancel_policy_rules;
CREATE POLICY "Public can view active rules" ON public.cancel_policy_rules
FOR SELECT TO anon, authenticated
USING (is_active = true);

-- 3. Fix cancel_policies RLS to be more robust
DROP POLICY IF EXISTS "Partners/Employees manage own cancel_policies" ON public.cancel_policies;
CREATE POLICY "Partners can manage their own cancel_policies"
ON public.cancel_policies
FOR ALL TO authenticated
USING (partner_id = get_current_partner_id())
WITH CHECK (partner_id = get_current_partner_id());

-- 4. Enable Public read for active policies
DROP POLICY IF EXISTS "Public read access for cancel_policies" ON public.cancel_policies;
CREATE POLICY "Public read access for cancel_policies"
USING (is_active = true);
