-- ========================================================
-- ADVANCED BOOKING APPROVAL & AUDIT LOGGING SYSTEM
-- ========================================================

-- 1. Function to handle booking status updates with audit logging
-- Usage: Called via RPC from frontend for Approval/Rejection
DROP FUNCTION IF EXISTS public.update_booking_status_v3(BIGINT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.update_booking_status_v3(BIGINT, public.booking_status, TEXT);

CREATE OR REPLACE FUNCTION public.update_booking_status_v3(
    p_booking_id BIGINT,
    p_new_status public.booking_status,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_old_status TEXT;
    v_user_id UUID := auth.uid();
    v_employee_id INTEGER := NULL;
BEGIN
    -- 1. Get current status and verify existence
    SELECT booking_status::TEXT INTO v_old_status 
    FROM public.bookings 
    WHERE booking_id = p_booking_id;

    IF v_old_status IS NULL THEN
        RAISE EXCEPTION 'Booking #% not found', p_booking_id;
    END IF;

    -- 2. Identify the active employee/admin making the change
    -- Search in employees table via users table using auth_id
    SELECT e.employee_id INTO v_employee_id 
    FROM public.employees e
    JOIN public.users u ON e.user_id = u.user_id
    WHERE u.auth_id = v_user_id;

    -- 3. Perform the update
    UPDATE public.bookings 
    SET 
        booking_status = p_new_status,
        cancel_reason = CASE WHEN p_new_status::TEXT IN ('cancelled', 'rejected') THEN p_notes ELSE cancel_reason END,
        cancel_timestamp = CASE WHEN p_new_status::TEXT IN ('cancelled', 'rejected') THEN now() ELSE cancel_timestamp END
    WHERE booking_id = p_booking_id;

    -- Update passengers status to match booking cancellation/rejection
    IF p_new_status::TEXT IN ('cancelled', 'rejected') THEN
        UPDATE public.passengers 
        SET passenger_status = 'cancelled'
        WHERE booking_id = p_booking_id;
    END IF;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking #% update failed (Target row not updated)', p_booking_id;
    END IF;

    -- 4. Log the action in booking_approvals
    INSERT INTO public.booking_approvals (
        booking_id,
        employee_id,
        action_type,
        old_status,
        new_status,
        notes
    ) VALUES (
        p_booking_id,
        v_employee_id,
        CASE 
            WHEN p_new_status::TEXT = 'confirmed' THEN 'approve'
            WHEN p_new_status::TEXT IN ('cancelled', 'rejected') THEN 'reject'
            ELSE 'update'
        END,
        v_old_status,
        p_new_status::TEXT,
        p_notes
    );

    RETURN jsonb_build_object(
        'success', true, 
        'booking_id', p_booking_id, 
        'old_status', v_old_status, 
        'new_status', p_new_status::TEXT
    );
END;
$$;

-- 2. Grant access
GRANT EXECUTE ON FUNCTION public.update_booking_status_v3 TO authenticated;

-- 3. Security Hardening for the Approvals table
ALTER TABLE public.booking_approvals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all approvals" ON public.booking_approvals;
CREATE POLICY "Admins can view all approvals" ON public.booking_approvals
FOR SELECT USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Partners view related approvals" ON public.booking_approvals;
CREATE POLICY "Partners view related approvals" ON public.booking_approvals
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.bookings b
        JOIN public.trips t ON t.trip_id = b.trip_id
        WHERE b.booking_id = public.booking_approvals.booking_id
        AND t.partner_id = (SELECT partner_id FROM public.user_roles WHERE user_id = auth.uid())
    )
);

-- 4. Fix Update RLS for Bookings table
-- Allow partners/employees to update status if they own the trip
DROP POLICY IF EXISTS "Partners/Employees update own bookings" ON public.bookings;
CREATE POLICY "Partners/Employees update own bookings" ON public.bookings
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.trips t
        WHERE t.trip_id = public.bookings.trip_id
        AND t.partner_id = (SELECT partner_id FROM public.user_roles WHERE user_id = auth.uid())
    )
) WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.trips t
        WHERE t.trip_id = public.bookings.trip_id
        AND t.partner_id = (SELECT partner_id FROM public.user_roles WHERE user_id = auth.uid())
    )
);
