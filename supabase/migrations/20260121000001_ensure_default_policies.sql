-- ========================================================
-- ENSURE DEFAULT CANCELLATION POLICIES FOR ALL PARTNERS
-- ========================================================

DO $$
DECLARE
    v_partner RECORD;
    v_policy_id BIGINT;
BEGIN
    FOR v_partner IN SELECT * FROM public.partners LOOP
        -- Check if partner has a default policy
        SELECT cancel_policy_id INTO v_policy_id
        FROM public.cancel_policies
        WHERE partner_id = v_partner.partner_id AND is_default = true
        LIMIT 1;

        -- If no default policy, create one
        IF v_policy_id IS NULL THEN
            INSERT INTO public.cancel_policies (
                partner_id, policy_name, description, refund_percentage, 
                is_default, is_active, priority
            ) VALUES (
                v_partner.partner_id,
                'السياسة القياسية',
                'استرداد كامل قبل 24 ساعة، وخصم متدرج عند الاقتراب من موعد الرحلة',
                100.00, -- Default refund if no rule matches (Early cancellation)
                true,
                true,
                10
            ) RETURNING cancel_policy_id INTO v_policy_id;

            -- Add standard rules for this policy
            -- 1. Less than 6 hours: 50% refund
            INSERT INTO public.cancel_policy_rules (
                cancel_policy_id, min_hours_before_departure, max_hours_before_departure, 
                refund_percentage, cancellation_fee, display_order
            ) VALUES (v_policy_id, 0, 6, 50.00, 0, 1);

            -- 2. From 6 to 24 hours: 75% refund
            INSERT INTO public.cancel_policy_rules (
                cancel_policy_id, min_hours_before_departure, max_hours_before_departure, 
                refund_percentage, cancellation_fee, display_order
            ) VALUES (v_policy_id, 6, 24, 75.00, 0, 2);
            
            -- Note: More than 24 hours will fallback to 100% refund percentage from the policy table
        END IF;
    END LOOP;
END $$;
