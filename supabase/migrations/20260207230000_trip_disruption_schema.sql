-- ========================================================
-- TRIP DISRUPTION SCHEMA
-- Date: 2026-02-07
-- Purpose: Track delays, diversions, and emergency statuses
-- ========================================================

BEGIN;

-- 1. EXTEND ENUMS (Safe Execution)
-- ========================================================
DO $$
BEGIN
    ALTER TYPE public.trip_status ADD VALUE IF NOT EXISTS 'diverted';
    ALTER TYPE public.trip_status ADD VALUE IF NOT EXISTS 'emergency';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. ADD COLUMNS TO TRIPS TABLE
-- ========================================================
ALTER TABLE public.trips 
ADD COLUMN IF NOT EXISTS delay_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_diverted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS disruption_logs JSONB DEFAULT '[]'::jsonb;

-- 3. RLS POLICIES FOR DISRUPTION LOGS
-- ========================================================
-- Ensure partners can update these columns
-- (Existing policies usually cover "UPDATE" on trips, but we verify)

-- 4. AUDIT LOGGING FUNCTION
-- ========================================================
CREATE OR REPLACE FUNCTION public.log_trip_disruption()
RETURNS TRIGGER AS $$
BEGIN
    -- Log Delay Changes
    IF NEW.delay_minutes IS DISTINCT FROM OLD.delay_minutes THEN
        NEW.disruption_logs := NEW.disruption_logs || 
        jsonb_build_object(
            'event', 'delay_update',
            'old_delay', OLD.delay_minutes,
            'new_delay', NEW.delay_minutes,
            'timestamp', now()
        );
    END IF;

    -- Log Diversion
    IF NEW.is_diverted IS DISTINCT FROM OLD.is_diverted AND NEW.is_diverted = true THEN
        NEW.disruption_logs := NEW.disruption_logs || 
        jsonb_build_object(
            'event', 'route_diverted',
            'timestamp', now()
        );
    END IF;

    -- Log Status Changes (Emergency/Cancelled)
    IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('emergency', 'diverted') THEN
        NEW.disruption_logs := NEW.disruption_logs || 
        jsonb_build_object(
            'event', 'status_change',
            'new_status', NEW.status,
            'timestamp', now()
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for logging
DROP TRIGGER IF EXISTS trigger_log_trip_disruption ON public.trips;
CREATE TRIGGER trigger_log_trip_disruption
BEFORE UPDATE ON public.trips
FOR EACH ROW
EXECUTE FUNCTION public.log_trip_disruption();

COMMIT;
