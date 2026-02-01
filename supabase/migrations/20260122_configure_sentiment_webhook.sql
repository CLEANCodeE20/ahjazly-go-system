-- ========================================================
-- CONFIGURE SENTIMENT ANALYSIS WEBHOOK
-- إعداد رابط ومفتاح Supabase لخدمة تحليل المشاعر
-- ========================================================

-- IMPORTANT: Replace the placeholders below with your actual values
-- هام: استبدل القيم أدناه بالقيم الفعلية الخاصة بمشروعك

INSERT INTO public.system_config (key, value, description, category, is_public)
VALUES 
    (
        'supabase_url', 
        '"https://kbgbftyvbdgyoeosxlok.supabase.co"'::jsonb, 
        'The base URL of your Supabase project (e.g., https://xyz.supabase.co)', 
        'system', 
        false
    ),
    (
        'supabase_service_role_key', 
        '"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiZ2JmdHl2YmRneW9lb3N4bG9rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjU3MTExNywiZXhwIjoyMDgyMTQ3MTE3fQ.-oiIri8pTmxJATXAmyYU8K8sobTtI4e7kHGeqHX0mwo"'::jsonb, 
        'The Service Role Key (secret) for internal API calls', 
        'security', 
        false
    )
ON CONFLICT (key) DO UPDATE
SET 
    value = EXCLUDED.value,
    updated_at = NOW();

-- Verify the insertion
-- التحقق من الإضافة
SELECT key, category, updated_at FROM public.system_config WHERE key IN ('supabase_url', 'supabase_service_role_key');
