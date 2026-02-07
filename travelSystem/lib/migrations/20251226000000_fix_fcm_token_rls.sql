-- =====================================================
-- Fix: Ensure RLS policies allow INSERT/UPDATE on user_device_tokens
-- Date: 2025-12-26
-- Purpose: Allow authenticated users to register and update their FCM tokens
-- =====================================================

-- First, drop the old read-only policy if it exists
DROP POLICY IF EXISTS "Read access for user_device_tokens" ON public.user_device_tokens;

-- Create comprehensive policy for authenticated users to manage their own device tokens
CREATE POLICY "Users can manage own device tokens" ON public.user_device_tokens 
FOR ALL TO authenticated 
USING (user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid())) 
WITH CHECK (user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid()));

-- Verify the policy was created
SELECT policyname, cmd, qual::text, with_check::text 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'user_device_tokens';
