-- ==========================================================
-- TOTAL NOTIFICATION & IDENTITY ALIGNMENT (Phase 4)
-- Purpose: Fix ALL remaining triggers and functions using legacy user_id
-- specifically fixing the Dispatch Webhook and Rating/Refund flows.
-- ==========================================================

BEGIN;

-- 1. FIX NOTIFICATION DISPATCH WEBHOOK (The main blocker)
CREATE OR REPLACE FUNCTION public.trigger_notification_dispatch()
RETURNS TRIGGER AS $$
DECLARE
  payload JSONB;
  response_id BIGINT;
  edge_function_url TEXT := 'https://kbgbftyvbdgyoeosxlok.supabase.co/functions/v1/notify';
BEGIN
  -- Construct the payload using auth_id (UUID)
  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'notification_id', NEW.notification_id,
    'auth_id', NEW.auth_id, -- CHANGED FROM user_id
    'title', NEW.title,
    'message', NEW.message,
    'notification_type', NEW.type,
    'priority', COALESCE(NEW.priority, 'medium'),
    'created_at', NEW.sent_at -- Using standardized sent_at
  );

  -- Make async HTTP request
  SELECT net.http_post(
    url := edge_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := payload::text::jsonb
  ) INTO response_id;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to trigger notification webhook: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. FIX RATING RESPONSE NOTIFICATION
CREATE OR REPLACE FUNCTION public.notify_user_on_rating_response()
RETURNS TRIGGER AS $$
DECLARE
    v_user_auth_id UUID;
BEGIN
    -- Get the auth_id (UUID) of the user who made the rating
    SELECT auth_id INTO v_user_auth_id
    FROM public.ratings
    WHERE rating_id = NEW.rating_id;
    
    -- Send notification using auth_id
    INSERT INTO public.notifications (auth_id, title, message, type)
    VALUES (v_user_auth_id, 'رد على تقييمك', 'تم الرد على تقييمك من قبل الشريك', 'trip');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. FIX ADMIN REPORT NOTIFICATION
CREATE OR REPLACE FUNCTION public.notify_admin_on_rating_reports()
RETURNS TRIGGER AS $$
DECLARE
    v_report_count INTEGER;
    v_admin_auth_id UUID;
BEGIN
    SELECT COUNT(*) INTO v_report_count FROM public.rating_reports WHERE rating_id = NEW.rating_id AND status = 'pending';
    
    IF v_report_count >= 3 THEN
        FOR v_admin_auth_id IN (SELECT auth_id FROM public.users WHERE user_type = 'admin' AND account_status = 'active') LOOP
            INSERT INTO public.notifications (auth_id, title, message, type, priority)
            VALUES (v_admin_auth_id, 'بلاغ تقييم', format('تنبيه: التقييم رقم %s تم الإبلاغ عنه %s مرات.', NEW.rating_id, v_report_count), 'system', 'high');
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. FIX REFUND STATUS UPDATE FUNCTION
CREATE OR REPLACE FUNCTION public.update_refund_status(
    p_refund_id BIGINT,
    p_new_status refund_status_enum,
    p_refund_reference VARCHAR DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_rejection_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_actor_auth_id UUID := auth.uid();
    v_refund RECORD;
BEGIN
    SELECT * INTO v_refund FROM public.refunds WHERE refund_id = p_refund_id;
    IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'message', 'Refund not found'); END IF;
    
    UPDATE public.refunds
    SET 
        status = p_new_status,
        refund_reference = COALESCE(p_refund_reference, refund_reference),
        notes = COALESCE(p_notes, notes),
        rejection_reason = CASE WHEN p_new_status = 'rejected' THEN p_rejection_reason ELSE rejection_reason END,
        processed_at = CASE WHEN p_new_status = 'completed' THEN NOW() ELSE processed_at END
    WHERE refund_id = p_refund_id;
    
    IF p_new_status = 'completed' THEN
        INSERT INTO public.notifications (auth_id, title, message, type, priority)
        VALUES (v_refund.auth_id, 'تم الاسترداد', format('تم استرداد مبلغ %s ر.س للحجز رقم #%s', v_refund.refund_amount, v_refund.booking_id), 'payment', 'high');
    ELSIF p_new_status = 'rejected' THEN
        INSERT INTO public.notifications (auth_id, title, message, type, priority)
        VALUES (v_refund.auth_id, 'رفض الاسترداد', format('تم رفض طلب استرداد المبلغ للحجز رقم #%s.', v_refund.booking_id), 'payment', 'high');
    END IF;
    
    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. FIX REFUND COMPLETED TRIGGER
CREATE OR REPLACE FUNCTION public.notify_user_refund_completed()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'completed') THEN
        INSERT INTO public.notifications (auth_id, title, message, type, priority)
        VALUES (NEW.auth_id, 'تمت عملية الاسترداد', format('تم بنجاح تحويل مبلغ %s ر.س للحجز رقم #%s.', NEW.refund_amount, NEW.booking_id), 'booking', 'high');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. FIX NEW PARTNER ADMIN NOTIFICATION
CREATE OR REPLACE FUNCTION public.notify_admin_new_partner()
RETURNS TRIGGER AS $$
DECLARE
    v_admin_auth_id UUID;
BEGIN
    SELECT auth_id INTO v_admin_auth_id FROM public.users WHERE user_type = 'admin' LIMIT 1;
    IF v_admin_auth_id IS NOT NULL THEN
        INSERT INTO public.notifications (auth_id, title, message, type, priority)
        VALUES (v_admin_auth_id, 'طلب انضمام جديد', 'تقدمت شركة ' || NEW.company_name || ' بطلب انضمام.', 'system', 'high');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. ENSURE REFUNDS TABLE HAS AUTH_ID
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'refunds' AND column_name = 'auth_id') THEN
        ALTER TABLE public.refunds ADD COLUMN auth_id UUID REFERENCES auth.users(id);
        
        -- Backfill
        UPDATE public.refunds r SET auth_id = u.auth_id FROM public.users u WHERE r.user_id = u.user_id;
        
        -- Optional: DROP legacy user_id column from refunds later or now
        -- ALTER TABLE public.refunds DROP COLUMN user_id CASCADE;
    END IF;
END $$;

COMMIT;
