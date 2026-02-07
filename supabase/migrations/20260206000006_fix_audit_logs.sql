-- Migration: 20260206000006_fix_audit_logs.sql
-- Description: Enterprise-grade Audit Logging System (Immutability + Context Awareness)

-- 1. Create the robust audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id BIGSERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    operation TEXT NOT NULL, -- INSERT, UPDATE, DELETE
    old_data JSONB,
    new_data JSONB,
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    client_info JSONB -- Stores { ip, user_agent, origin, ... }
);

-- 2. Performance Indexing
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON public.audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_at ON public.audit_logs(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_by ON public.audit_logs(changed_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_operation ON public.audit_logs(operation);

-- 3. Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 4. Policies (Read-Only)
-- Only SUPERUSER can view. No one can insert/update/delete directly via API.
DROP POLICY IF EXISTS "Admins view all audit logs" ON public.audit_logs;
CREATE POLICY "Admins view all audit logs" ON public.audit_logs
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'SUPERUSER'));

-- 5. IMMUTABILITY ENFORCEMENT
-- Prevent any UPDATE or DELETE on the audit log table, even by owners/admins.
CREATE OR REPLACE FUNCTION public.prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are immutable and cannot be modified or deleted. (Compliance Policy)';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_audit_modification_trigger ON public.audit_logs;
CREATE TRIGGER prevent_audit_modification_trigger
    BEFORE UPDATE OR DELETE ON public.audit_logs
    FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_modification();

-- 6. Context-Aware Audit Trigger Function
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
    v_old_data JSONB;
    v_new_data JSONB;
    v_record_id TEXT;
    v_pk_column TEXT;
    v_headers JSONB;
    v_client_info JSONB;
BEGIN
    -- 6.1 Context Capture
    -- Try to capture Request Headers from Supabase/PostgREST context
    BEGIN
        v_headers := current_setting('request.headers', true)::jsonb;
    EXCEPTION WHEN OTHERS THEN
        v_headers := '{}'::jsonb;
    END;

    v_client_info := jsonb_build_object(
        'ip', COALESCE(v_headers->>'x-forwarded-for', v_headers->>'cf-connecting-ip', 'unknown'),
        'user_agent', COALESCE(v_headers->>'user-agent', 'unknown'),
        'origin', COALESCE(v_headers->>'origin', 'unknown')
    );

    -- 6.2 Data Capture
    v_pk_column := TG_ARGV[0];
    IF v_pk_column IS NULL THEN v_pk_column := 'id'; END IF;

    IF (TG_OP = 'UPDATE') THEN
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
        EXECUTE format('SELECT ($1).%I::text', v_pk_column) USING OLD INTO v_record_id;
    ELSIF (TG_OP = 'DELETE') THEN
        v_old_data := to_jsonb(OLD);
        v_new_data := NULL;
        EXECUTE format('SELECT ($1).%I::text', v_pk_column) USING OLD INTO v_record_id;
    ELSIF (TG_OP = 'INSERT') THEN
        v_old_data := NULL;
        v_new_data := to_jsonb(NEW);
        EXECUTE format('SELECT ($1).%I::text', v_pk_column) USING NEW INTO v_record_id;
    END IF;

    -- 6.3 Change Detection (Optimization)
    -- If UPDATE but data didn't change (only timestamps?), skip logging
    -- Exception: if critical columns changed. For now, we log everything if it's not identical.
    IF (TG_OP = 'UPDATE' AND v_old_data IS NOT DISTINCT FROM v_new_data) THEN
        RETURN NEW;
    END IF;

    -- 6.4 Secure Insertion (Bypassing RLS via SECURITY DEFINER)
    INSERT INTO public.audit_logs (
        table_name,
        record_id,
        operation,
        old_data,
        new_data,
        changed_by,
        changed_at,
        client_info
    ) VALUES (
        TG_TABLE_NAME,
        v_record_id,
        TG_OP,
        v_old_data,
        v_new_data,
        auth.uid(),
        NOW(),
        v_client_info
    );

    RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
    -- Fail-safe: Ensure application doesn't crash if audit logging fails (optional, depending on strictness)
    -- For "Robust" systems, we usually WANT it to fail if it can't audit.
    -- But for web apps, we log warning.
    RAISE WARNING 'Audit log failed: %', SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Attach Triggers to Critical Tables

-- Bookings
DROP TRIGGER IF EXISTS audit_bookings_trigger ON public.bookings;
CREATE TRIGGER audit_bookings_trigger AFTER INSERT OR UPDATE OR DELETE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.log_audit_event('booking_id');

-- Trips
DROP TRIGGER IF EXISTS audit_trips_trigger ON public.trips;
CREATE TRIGGER audit_trips_trigger AFTER INSERT OR UPDATE OR DELETE ON public.trips FOR EACH ROW EXECUTE FUNCTION public.log_audit_event('trip_id');

-- Partners
DROP TRIGGER IF EXISTS audit_partners_trigger ON public.partners;
CREATE TRIGGER audit_partners_trigger AFTER INSERT OR UPDATE OR DELETE ON public.partners FOR EACH ROW EXECUTE FUNCTION public.log_audit_event('partner_id');

-- Routes
DROP TRIGGER IF EXISTS audit_routes_trigger ON public.routes;
CREATE TRIGGER audit_routes_trigger AFTER INSERT OR UPDATE OR DELETE ON public.routes FOR EACH ROW EXECUTE FUNCTION public.log_audit_event('route_id');

-- Users
DROP TRIGGER IF EXISTS audit_users_trigger ON public.users;
CREATE TRIGGER audit_users_trigger AFTER INSERT OR UPDATE OR DELETE ON public.users FOR EACH ROW EXECUTE FUNCTION public.log_audit_event('auth_id');

-- Ledger
DROP TRIGGER IF EXISTS audit_ledger_trigger ON public.booking_ledger;
CREATE TRIGGER audit_ledger_trigger AFTER INSERT OR UPDATE OR DELETE ON public.booking_ledger FOR EACH ROW EXECUTE FUNCTION public.log_audit_event('ledger_id');

-- Grant permissions (ReadOnly for Authenticated if needed, but actually only Admin RLS is set)
GRANT SELECT ON public.audit_logs TO authenticated;
-- REVOKE ALL modifications from public/authenticated on audit_logs to be extra sure
REVOKE INSERT, UPDATE, DELETE ON public.audit_logs FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.audit_logs FROM anon;
