-- ==========================================================
-- ENTERPRISE TRIP CANCELLATION STRATEGY (Phase 6)
-- Date: 2026-02-03
-- Purpose: Mass-cancellation guard, Instant Wallet Refunds, Alternative Suggestions
-- ==========================================================

BEGIN;

-- 1. EXTEND TRIP STATUS ENUM
-- Note: ALTER TYPE ... ADD VALUE cannot be executed in a transaction block in some PG versions.
-- We'll use a DO block to handle it safely or assume Supabase supports it.
COMMIT;
ALTER TYPE public.trip_status ADD VALUE IF NOT EXISTS 'pending_cancellation';
BEGIN;

-- 2. GLOBAL SYSTEM SETTINGS (For thresholds)
CREATE TABLE IF NOT EXISTS public.system_settings (
    setting_key VARCHAR(50) PRIMARY KEY,
    setting_value JSONB,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

INSERT INTO public.system_settings (setting_key, setting_value, description)
VALUES (
    'trip_cancellation_threshold', 
    '20', 
    'Number of confirmed passengers that triggers a Superuser approval for trip cancellation'
) ON CONFLICT (setting_key) DO NOTHING;

-- 3. FUNCTION: Request Trip Cancellation (Enterprise Logic)
CREATE OR REPLACE FUNCTION public.request_trip_cancellation(p_trip_id BIGINT, p_reason TEXT)
RETURNS JSONB AS $$
DECLARE
    v_passenger_count INT;
    v_threshold INT;
    v_trip_record RECORD;
    v_role TEXT;
BEGIN
    -- Get current role
    v_role := public.get_current_role();
    
    -- Fetch trip & passenger count
    SELECT t.* INTO v_trip_record FROM public.trips t WHERE t.trip_id = p_trip_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Trip not found');
    END IF;

    SELECT count(*) INTO v_passenger_count 
    FROM public.bookings 
    WHERE trip_id = p_trip_id AND booking_status = 'confirmed';

    -- Get threshold
    SELECT (setting_value->>0)::int INTO v_threshold 
    FROM public.system_settings 
    WHERE setting_key = 'trip_cancellation_threshold';
    v_threshold := COALESCE(v_threshold, 20);

    -- LOGIC:
    -- If Superuser OR Partner Admin of the same company OR below threshold -> Cancel Immediately
    -- Otherwise (Employee/Support) -> Set to Pending Approval and notify Partner Admin

    IF v_role = 'SUPERUSER' 
       OR (v_role = 'PARTNER_ADMIN' AND (SELECT partner_id FROM public.user_roles WHERE user_id = auth.uid()) = v_trip_record.partner_id)
       OR v_passenger_count < v_threshold 
    THEN
        -- Execute immediate cancellation cascade
        UPDATE public.trips SET status = 'cancelled' WHERE trip_id = p_trip_id;
        RETURN jsonb_build_object('success', true, 'action', 'cancelled_immediately', 'passengers', v_passenger_count);
    ELSE
        -- Set to pending approval
        UPDATE public.trips SET status = 'pending_cancellation' WHERE trip_id = p_trip_id;
        
        -- Notify PARTNER_ADMIN of the SAME company
        INSERT INTO public.notifications (auth_id, title, message, type, priority, action_url)
        SELECT user_id, 'طلب إلغاء رحلة جماعي', 
               format('تطلب أحد الموظفين إلغاء الرحلة رقم #%s (بها %s راكب). يرجى المراجعة.', 
                      p_trip_id, v_passenger_count),
               'trip', 'high', '/dashboard/trips'
        FROM public.user_roles 
        WHERE role = 'PARTNER_ADMIN' 
          AND partner_id = v_trip_record.partner_id;

        RETURN jsonb_build_object('success', true, 'action', 'pending_approval', 'passengers', v_passenger_count);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. FUNCTION: Execute Enterprise Refund Cascade
-- This function handles the "Wallet First" logic
CREATE OR REPLACE FUNCTION public.execute_enterprise_refund_cascade()
RETURNS TRIGGER AS $$
DECLARE
    v_booking RECORD;
    v_trip_info TEXT;
    v_alt_trip_id BIGINT;
BEGIN
    -- Only act when trip transition to 'cancelled'
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        
        -- Fetch trip context for notifications
        SELECT r.origin_city || ' - ' || r.destination_city INTO v_trip_info
        FROM public.routes r WHERE r.route_id = NEW.route_id;

        -- Loop through all confirmed bookings
        FOR v_booking IN (
            SELECT b.*, u.auth_id as user_uuid
            FROM public.bookings b
            JOIN public.users u ON b.auth_id = u.auth_id
            WHERE b.trip_id = NEW.trip_id AND b.booking_status = 'confirmed'
        ) LOOP
            
            -- 1. Attempt Instant Wallet Refund if paid
            IF v_booking.payment_status = 'paid' THEN
                -- Try to process via wallet system
                PERFORM public.process_wallet_transaction_uuid(
                    v_booking.auth_id,
                    'deposit',
                    v_booking.total_price,
                    v_booking.booking_id::text,
                    format('استرداد تلقائي لإلغاء رحلة (%s)', v_trip_info)
                );
                
                -- Update booking status to refunded
                UPDATE public.bookings 
                SET payment_status = 'refunded',
                    refund_amount = total_price
                WHERE booking_id = v_booking.booking_id;
            END IF;

            -- 2. Update Booking Status
            UPDATE public.bookings 
            SET booking_status = 'cancelled',
                cancel_reason = 'Enterprise Auto-Cancellation: Trip Cancelled by Carrier',
                cancel_timestamp = now()
            WHERE booking_id = v_booking.booking_id;

            -- 3. Notify Passenger with Alternative Option (Search for next trip on same route)
            SELECT trip_id INTO v_alt_trip_id
            FROM public.trips
            WHERE route_id = NEW.route_id 
              AND departure_time > NEW.departure_time
              AND status = 'scheduled'
            ORDER BY departure_time ASC
            LIMIT 1;

            IF v_alt_trip_id IS NOT NULL THEN
                INSERT INTO public.notifications (auth_id, title, message, type, priority, action_url)
                VALUES (
                    v_booking.auth_id,
                    'اقتراح رحلة بديلة 🚌',
                    format('نعتذر عن إلغاء رحلتك. تم استرداد المبلغ لمحفظتك. يمكنك حجز الرحلة القادمة المتاحة في تمام الساعة %s.', 
                           (SELECT to_char(departure_time, 'HH:MI AM') FROM public.trips WHERE trip_id = v_alt_trip_id)),
                    'trip', 'high', '/trips/' || v_alt_trip_id
                );
            ELSE
                INSERT INTO public.notifications (auth_id, title, message, type, priority)
                VALUES (
                    v_booking.auth_id,
                    'تنبيه: تم إلغاء الرحلة',
                    format('نأسف لإبلاغك بإلغاء رحلة (%s). تم استرداد مبلغ الحجز كاملاً لمحفظتك الإلكترونية.', v_trip_info),
                    'trip', 'high'
                );
            END IF;

        END LOOP;

        -- 4. Release all seats
        UPDATE public.passengers SET passenger_status = 'cancelled'
        WHERE trip_id = NEW.trip_id AND passenger_status = 'active';

    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. ATTACH ENTERPRISE TRIGGER
DROP TRIGGER IF EXISTS trigger_enterprise_trip_cancellation ON public.trips;
CREATE TRIGGER trigger_enterprise_trip_cancellation
AFTER UPDATE ON public.trips
FOR EACH ROW EXECUTE FUNCTION public.execute_enterprise_refund_cascade();

COMMIT;
