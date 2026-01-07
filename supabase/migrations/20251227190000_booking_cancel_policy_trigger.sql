-- ========================================================
-- AUTOMATIC CANCELLATION POLICY ASSIGNMENT TRIGGER
-- ========================================================

-- 1. Function to find and assign the default cancel policy for a booking
CREATE OR REPLACE FUNCTION public.handle_booking_cancellation_policy()
RETURNS TRIGGER AS $$
DECLARE
    default_policy_id BIGINT;
    trip_partner_id BIGINT;
BEGIN
    -- Get the partner_id from the trip
    SELECT partner_id INTO trip_partner_id 
    FROM public.trips 
    WHERE trip_id = NEW.trip_id;

    -- Find the default active policy for this partner
    SELECT cancel_policy_id INTO default_policy_id
    FROM public.cancel_policies
    WHERE partner_id = trip_partner_id
      AND is_default = true
      AND is_active = true
    ORDER BY priority DESC
    LIMIT 1;

    -- If no default, find the most recent active policy
    IF default_policy_id IS NULL THEN
        SELECT cancel_policy_id INTO default_policy_id
        FROM public.cancel_policies
        WHERE partner_id = trip_partner_id
          AND is_active = true
        ORDER BY priority DESC, created_at DESC
        LIMIT 1;
    END IF;

    -- Set the policy ID in the booking record
    IF default_policy_id IS NOT NULL THEN
        NEW.cancel_policy_id := default_policy_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger
DROP TRIGGER IF EXISTS tr_assign_booking_cancel_policy ON public.bookings;
CREATE TRIGGER tr_assign_booking_cancel_policy
BEFORE INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.handle_booking_cancellation_policy();
