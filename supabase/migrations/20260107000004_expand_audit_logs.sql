-- ========================================================
-- EXPAND AUDIT LOGGING FOR CRITICAL TABLES
-- ========================================================

-- 1. Create a generic audit trigger function
CREATE OR REPLACE FUNCTION public.log_critical_action()
RETURNS TRIGGER AS $$
DECLARE
    v_old_data JSONB;
    v_new_data JSONB;
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
    ELSIF (TG_OP = 'DELETE') THEN
        v_old_data := to_jsonb(OLD);
        v_new_data := NULL;
    ELSIF (TG_OP = 'INSERT') THEN
        v_old_data := NULL;
        v_new_data := to_jsonb(NEW);
    END IF;

    -- Only log meaningful changes (ignore update timestamp only)
    IF (TG_OP = 'UPDATE' AND v_old_data IS NOT DISTINCT FROM v_new_data) THEN
        RETURN NEW;
    END IF;

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
        CASE 
            WHEN TG_OP = 'DELETE' THEN (OLD.id)::text
            ELSE (NEW.id)::text
        END,
        TG_OP,
        v_old_data,
        v_new_data,
        auth.uid(),
        NOW()
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the audit_logs table if not exists (it might be named differently in previous migrations, checking schema)
-- Based on previous file: role_changes_log was created. Let's create a generic audit_logs table.
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id BIGSERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    operation TEXT NOT NULL, -- INSERT, UPDATE, DELETE
    old_data JSONB,
    new_data JSONB,
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    changed_at TIMESTAMP DEFAULT NOW()
);

-- 3. Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for audit_logs
DROP POLICY IF EXISTS "Admins view all audit logs" ON public.audit_logs;
CREATE POLICY "Admins view all audit logs" ON public.audit_logs
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- 5. Attach Triggers to Critical Tables

-- Bookings
DROP TRIGGER IF EXISTS audit_bookings_trigger ON public.bookings;
CREATE TRIGGER audit_bookings_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION public.log_critical_action();

-- Financial Transactions (Booking Ledger)
DROP TRIGGER IF EXISTS audit_transactions_trigger ON public.booking_ledger;
CREATE TRIGGER audit_transactions_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.booking_ledger
    FOR EACH ROW EXECUTE FUNCTION public.log_critical_action();

-- Trips (Critical changes like cancellation)
DROP TRIGGER IF EXISTS audit_trips_trigger ON public.trips;
CREATE TRIGGER audit_trips_trigger
    AFTER UPDATE OR DELETE ON public.trips
    FOR EACH ROW EXECUTE FUNCTION public.log_critical_action();
