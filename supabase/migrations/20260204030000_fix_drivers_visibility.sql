-- =============================================
-- FIX DRIVERS VISIBILITY & METADATA SYNC
-- Date: 2026-02-04
-- Purpose: Ensure drivers are visible to company admins and sync metadata.
-- =============================================

BEGIN;

-- 1. BACKFILL DRIVER DATA (Sync missing names/phones from users table)
UPDATE public.drivers d
SET 
    full_name = u.full_name,
    phone_number = u.phone_number
FROM public.users u
WHERE d.auth_id = u.auth_id
AND (d.full_name IS NULL OR d.phone_number IS NULL);

-- 1.5 ENABLE RLS
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- 2. ENHANCE DRIVERS RLS (Be more inclusive of roles)
DROP POLICY IF EXISTS "Partner full access to drivers" ON public.drivers;
DROP POLICY IF EXISTS "Standard partner access" ON public.drivers;

CREATE POLICY "Unified Partner Access to Drivers" 
ON public.drivers 
FOR ALL 
TO authenticated
USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERUSER'
    OR (
        partner_id = (auth.jwt() -> 'app_metadata' ->> 'partner_id')::bigint
        AND (auth.jwt() -> 'app_metadata' ->> 'role') IN ('PARTNER_ADMIN', 'partner', 'manager', 'accountant', 'support', 'supervisor')
    )
);

-- 3. ENSURE METADATA SYNC (Critical for RLS matching)
-- This ensures that any user with a role in user_roles has their app_metadata updated.
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT ur.auth_id, ur.role, ur.partner_id 
        FROM public.user_roles ur
        JOIN auth.users au ON ur.auth_id = au.id
        WHERE (au.raw_app_meta_data ->> 'role') IS NULL 
           OR (au.raw_app_meta_data ->> 'partner_id') IS NULL
    ) LOOP
        UPDATE auth.users 
        SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || 
            jsonb_build_object('role', r.role::TEXT, 'partner_id', r.partner_id)
        WHERE id = r.auth_id;
    END LOOP;
END $$;

COMMIT;
