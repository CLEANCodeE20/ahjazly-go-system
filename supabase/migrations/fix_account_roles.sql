
-- FIX ACCOUNT ROLES FOR APPROVED PARTNERS
-- Run this in Supabase SQL Editor

BEGIN;

-- 1. Insert missing 'PARTNER_ADMIN' roles for approved applications
-- This finds users who have an approved application but no role in user_roles
-- 0. Ensure users exist in public.users (Fix FK Violation)
INSERT INTO public.users (auth_id, full_name, email, account_status, partner_id)
SELECT 
    pa.auth_user_id,
    pa.owner_name,
    pa.owner_email,
    'active',
    pa.partner_id
FROM public.partner_applications pa
WHERE pa.status = 'approved'
AND pa.auth_user_id IS NOT NULL
ON CONFLICT (auth_id) DO NOTHING;

-- 1. Upsert 'PARTNER_ADMIN' roles for approved applications
-- This handles both new insertions and updating existing 'TRAVELER' roles
INSERT INTO public.user_roles (auth_id, role, partner_id)
SELECT 
    pa.auth_user_id, 
    'PARTNER_ADMIN', 
    pa.partner_id
FROM public.partner_applications pa
WHERE pa.status = 'approved'
AND pa.auth_user_id IS NOT NULL
AND pa.partner_id IS NOT NULL
ON CONFLICT (auth_id) 
DO UPDATE SET 
    role = 'PARTNER_ADMIN',
    partner_id = EXCLUDED.partner_id;

-- 2. Force Sync Metadata for ALL Partner Admins
-- This ensures auth.users has the correct metadata for login checks
UPDATE auth.users u
SET raw_app_meta_data = 
    COALESCE(u.raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
        'role', ur.role, 
        'partner_id', ur.partner_id
    )
FROM public.user_roles ur
WHERE u.id = ur.auth_id
AND (ur.role = 'PARTNER_ADMIN' OR ur.role = 'partner');

-- 3. Also update public.users trigger-based fields if missing
-- Ensure they are set to 'active'
UPDATE public.users u
SET account_status = 'active',
    partner_id = ur.partner_id
FROM public.user_roles ur
WHERE u.auth_id = ur.auth_id
AND ur.role = 'PARTNER_ADMIN'
AND (u.account_status IS NULL OR u.account_status = 'pending');

COMMIT;
