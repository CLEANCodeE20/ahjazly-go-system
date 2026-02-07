-- Migration: 20260206000007_enhance_cities_table.sql
-- Description: Upgrade existing cities table with 'code', 'region' and sync with routes

-- 1. Add missing columns (Safe Alter)
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS code VARCHAR(10);
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS region VARCHAR(100);
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8);
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8);

-- 2. Populate 'code' for existing records (if missing)
UPDATE public.cities 
SET code = UPPER(SUBSTRING(name_en FROM 1 FOR 3)) 
WHERE code IS NULL AND name_en IS NOT NULL;

-- Fallback for records with no English name
UPDATE public.cities 
SET code = 'CTY-' || city_id 
WHERE code IS NULL;

-- 3. Ensure uniqueness on Code (optional but good practice)
-- Clean duplicates if any (unlikely for manual cities)
-- ALTER TABLE public.cities ADD CONSTRAINT cities_code_key UNIQUE (code);

-- 4. Import missing cities from Routes (Sync)
INSERT INTO public.cities (name_ar, name_en, code, is_active)
SELECT DISTINCT 
    city_name, 
    city_name, -- Placeholder EN
    UPPER(SUBSTRING(city_name FROM 1 FOR 3)), -- Fallback Code
    true
FROM (
    SELECT origin_city as city_name FROM public.routes
    UNION
    SELECT destination_city as city_name FROM public.routes
) AS route_cities
WHERE city_name NOT IN (SELECT name_ar FROM public.cities)
AND city_name IS NOT NULL
AND city_name != '';

-- 5. Update RLS Policies to use the unified Supervisor role
DROP POLICY IF EXISTS "Admins can manage cities" ON public.cities;
CREATE POLICY "Superusers can manage cities" 
ON public.cities FOR ALL 
TO authenticated 
USING (public.has_role(auth.uid(), 'SUPERUSER'))
WITH CHECK (public.has_role(auth.uid(), 'SUPERUSER'));

-- Ensure Public Access remains (if not exists)
DROP POLICY IF EXISTS "Anyone can view active cities" ON public.cities;
CREATE POLICY "Anyone can view active cities" 
ON public.cities FOR SELECT 
TO authenticated
USING (true); -- Relaxed to allow listing even inactive for admins, filtering done in UI

-- 6. Attach Audit Trigger (if available)
DO $$
BEGIN
    DROP TRIGGER IF EXISTS audit_cities_trigger ON public.cities;
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'log_audit_event') THEN
        CREATE TRIGGER audit_cities_trigger
            AFTER INSERT OR UPDATE OR DELETE ON public.cities
            FOR EACH ROW EXECUTE FUNCTION public.log_audit_event('city_id');
    END IF;
END $$;
