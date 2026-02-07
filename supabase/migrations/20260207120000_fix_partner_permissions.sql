
-- FIX: Standardize Partner Roles and Permissions
-- 1. Add 'PARTNER_ADMIN' to app_role ENUM to support legacy/user-preferred role name.
-- 2. Ensure RLS policies support 'PARTNER_ADMIN'.
-- 3. Ensure sync from user_roles to auth.users exists for immediate permission updates.

BEGIN;

-- Part 1: Add 'PARTNER_ADMIN' to ENUM if not exists
DO $$
BEGIN
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'PARTNER_ADMIN';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Part 2: Update RLS Policies to include 'PARTNER_ADMIN' (and 'partner' for future proofing)
DO $$ 
DECLARE 
    tbl TEXT;
    auth_tables TEXT[] := ARRAY[
        'employees', 'drivers', 'users', 'user_roles', 'ratings', 'wallets', 
        'bookings', 'booking_approvals', 'user_two_factor', 'documents', 'user_device_tokens',
        'routes', 'buses', 'cancel_policies'
    ];
BEGIN
    FOREACH tbl IN ARRAY auth_tables LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
            -- Re-define the policy
            EXECUTE format('DROP POLICY IF EXISTS "Standard partner access" ON public.%I', tbl);
            
            DECLARE
                v_using_clause TEXT := '(auth.jwt() -> ''app_metadata'' ->> ''role'') IN (''SUPERUSER'', ''admin'')';
            BEGIN
                -- Add Owner check
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'auth_id') THEN
                    v_using_clause := v_using_clause || ' OR auth_id = auth.uid()';
                END IF;

                -- Add Partner check (Including 'partner' and 'PARTNER_ADMIN')
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'partner_id') THEN
                    v_using_clause := v_using_clause || format(' OR (
                        (auth.jwt() -> ''app_metadata'' ->> ''partner_id'')::bigint = %I.partner_id
                        AND (auth.jwt() -> ''app_metadata'' ->> ''role'') IN (''partner'', ''PARTNER_ADMIN'', ''manager'', ''accountant'', ''support'', ''supervisor'')
                    )', tbl);
                END IF;

                EXECUTE format('CREATE POLICY "Standard partner access" ON public.%I FOR ALL USING (%s)', tbl, v_using_clause);
            END;
        END IF;
    END LOOP;
END $$;

-- Part 3: Ensure Trigger for Role Sync exists
CREATE OR REPLACE FUNCTION public.sync_user_role_to_metadata()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE auth.users
    SET raw_app_meta_data = 
        COALESCE(raw_app_meta_data, '{}'::jsonb) || 
        jsonb_build_object(
            'role', NEW.role,
            'partner_id', NEW.partner_id
        )
    WHERE id = NEW.auth_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sync_user_role ON public.user_roles;
CREATE TRIGGER trigger_sync_user_role
AFTER INSERT OR UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_role_to_metadata();

COMMIT;
