-- =============================================
-- Fix Audit Log Function
-- إصلاح دالة سجل التدقيق لتتعامل مع مفاتيح أساسية مختلفة
-- =============================================

CREATE OR REPLACE FUNCTION public.log_critical_action()
RETURNS TRIGGER AS $$
DECLARE
    v_old_data JSONB;
    v_new_data JSONB;
    v_record_id TEXT;
    v_record JSONB;
BEGIN
    -- Determine operation type and set data
    IF (TG_OP = 'DELETE') THEN
        v_old_data := to_jsonb(OLD);
        v_new_data := NULL;
        v_record := v_old_data;
    ELSIF (TG_OP = 'UPDATE') THEN
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
        v_record := v_new_data;
    ELSE -- INSERT
        v_old_data := NULL;
        v_new_data := to_jsonb(NEW);
        v_record := v_new_data;
    END IF;

    -- Try to extract ID from common primary key names
    -- محاولة استخراج المعرف من الأسماء الشائعة للمفاتيح الأساسية
    v_record_id := COALESCE(
        v_record->>'id',
        v_record->>'booking_id',
        v_record->>'trip_id',
        v_record->>'user_id',
        v_record->>'partner_id',
        v_record->>'driver_id',
        v_record->>'ticket_id',
        v_record->>'rating_id',
        'unknown'
    );

    -- Insert into audit logs
    INSERT INTO public.audit_logs (
        table_name,
        record_id,
        operation,
        old_data,
        new_data,
        changed_by,
        changed_at
    ) VALUES (
        TG_TABLE_NAME,
        v_record_id,
        TG_OP,
        v_old_data,
        v_new_data,
        auth.uid(),
        NOW()
    );

    RETURN NULL; -- Result is ignored since this is an AFTER trigger
EXCEPTION WHEN OTHERS THEN
    -- Fail gracefully without stopping the transaction
    -- في حالة الخطأ، لا توقف العملية الأصلية
    RAISE WARNING 'Audit log failed: %', SQLERRM;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.log_critical_action IS 'دالة تسجيل العمليات الحساسة مع دعم لأسماء مفاتيح متعددة';
