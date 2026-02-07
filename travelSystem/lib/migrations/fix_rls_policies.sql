-- =============================================
-- FIX RLS POLICIES FOR TRIPS & SEARCH
-- قم بتشغيل هذا السكريبت في Supabase SQL Editor
-- =============================================

-- 1. التأكد من منح صلاحيات القراءة للجداول الأساسية
GRANT SELECT ON public.trips TO anon, authenticated;
GRANT SELECT ON public.routes TO anon, authenticated;
GRANT SELECT ON public.route_stops TO anon, authenticated;
GRANT SELECT ON public.buses TO anon, authenticated;
GRANT SELECT ON public.bus_classes TO anon, authenticated;
GRANT SELECT ON public.partners TO anon, authenticated;
GRANT SELECT ON public.seats TO anon, authenticated;
GRANT SELECT ON public.cities TO anon, authenticated;

-- 2. إعادة إنشاء سياسات القراءة العامة (للتأكد من وجودها)
DO $$ 
BEGIN
    -- جداول الرحلات
    DROP POLICY IF EXISTS "Public read access for trips" ON public.trips;
    CREATE POLICY "Public read access for trips" ON public.trips FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public read access for routes" ON public.routes;
    CREATE POLICY "Public read access for routes" ON public.routes FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public read access for route_stops" ON public.route_stops;
    CREATE POLICY "Public read access for route_stops" ON public.route_stops FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public read access for buses" ON public.buses;
    CREATE POLICY "Public read access for buses" ON public.buses FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public read access for bus_classes" ON public.bus_classes;
    CREATE POLICY "Public read access for bus_classes" ON public.bus_classes FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public read access for partners" ON public.partners;
    CREATE POLICY "Public read access for partners" ON public.partners FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public read access for seats" ON public.seats;
    CREATE POLICY "Public read access for seats" ON public.seats FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public read access for cities" ON public.cities;
    CREATE POLICY "Public read access for cities" ON public.cities FOR SELECT USING (true);
END $$;

-- 3. التأكد من أن وظيفة البحث تعمل بصلاحيات الأدمن (SECURITY DEFINER)
-- هذا يضمن تجاوز RLS عند البحث من خلال الوظيفة
ALTER FUNCTION public.search_trips(TEXT, TEXT, DATE, TEXT) SECURITY DEFINER;
ALTER FUNCTION public.get_popular_destinations() SECURITY DEFINER;

-- 4. اختبار أخير
SELECT 'RLS Fix Applied' as status;
