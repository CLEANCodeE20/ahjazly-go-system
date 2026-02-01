-- ==========================================================
-- PERFORMANCE BOOST: JWT CUSTOM CLAIMS (Phase 2)
-- Date: 2026-01-31
-- Purpose: Storing User Role in JWT for Zero-Latency RLS
-- ==========================================================

BEGIN;

-- 1. FUNCTION TO SYNC ROLE TO AUTH.USERS CLAIMS
-- ==========================================================

CREATE OR REPLACE FUNCTION public.sync_user_role_to_claims()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_role TEXT;
BEGIN
    -- Get the professional role
    v_role := NEW.role::TEXT;

    -- Update the raw_app_meta_data in auth.users
    -- This stores the role in the JWT token itself
    UPDATE auth.users
    SET raw_app_meta_data = 
        COALESCE(raw_app_meta_data, '{}'::jsonb) || 
        jsonb_build_object('role', v_role)
    WHERE id = NEW.user_id;

    RETURN NEW;
END;
$$;

-- 2. TRIGGER ON USER_ROLES TABLE
-- ==========================================================

DROP TRIGGER IF EXISTS tr_sync_role_to_claims ON public.user_roles;
CREATE TRIGGER tr_sync_role_to_claims
    AFTER INSERT OR UPDATE ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_user_role_to_claims();

-- 3. INITIAL SYNC FOR EXISTING USERS
-- ==========================================================

UPDATE auth.users u
SET raw_app_meta_data = 
    COALESCE(u.raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', ur.role::TEXT)
FROM public.user_roles ur
WHERE u.id = ur.user_id;

-- 4. UPDATE RLS TO USE JWT CLAIMS (INSTANT CHECK)
-- ==========================================================

-- Example for wallets: Instead of joining, we read the claim
DROP POLICY IF EXISTS "Users can view own wallet" ON public.wallets;
CREATE POLICY "Users can view own wallet" ON public.wallets
    FOR SELECT USING (
        auth_id = auth.uid() OR 
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERUSER'
    );

DROP POLICY IF EXISTS "Admins can view all wallets" ON public.wallets;
CREATE POLICY "Admins can view all wallets" ON public.wallets
    FOR ALL USING (
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERUSER'
    );

COMMIT;
