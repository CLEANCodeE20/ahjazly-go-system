-- =============================================
-- POPULAR DESTINATIONS & CITY IMAGES
-- =============================================

-- 1. Add image_url to cities table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cities' AND column_name='image_url') THEN
        ALTER TABLE public.cities ADD COLUMN image_url TEXT;
    END IF;
END $$;

-- 2. Update existing cities with realistic images
UPDATE public.cities SET image_url = 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=500&q=60' WHERE name_ar = 'صنعاء';
UPDATE public.cities SET image_url = 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=500&q=60' WHERE name_ar = 'عدن';
UPDATE public.cities SET image_url = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=500&q=60' WHERE name_ar = 'تعز';
UPDATE public.cities SET image_url = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=500&q=60' WHERE name_ar = 'المكلا';
UPDATE public.cities SET image_url = 'https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=500&q=60' WHERE name_ar = 'الرياض';
UPDATE public.cities SET image_url = 'https://images.unsplash.com/photo-1565844713235-4304119a848c?auto=format&fit=crop&w=500&q=60' WHERE name_ar = 'مكه';

-- 3. Create RPC to get popular destinations based on actual bookings
DROP FUNCTION IF EXISTS public.get_popular_destinations();

CREATE OR REPLACE FUNCTION public.get_popular_destinations()
RETURNS TABLE (
    city_name TEXT,
    image_url TEXT,
    trips_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.name_ar as city_name,
        c.image_url,
        (
            SELECT COUNT(*) 
            FROM public.trips t
            JOIN public.routes r ON t.route_id = r.route_id
            WHERE r.destination_city = c.name_ar
              AND t.departure_time >= NOW()
              AND t.status = 'scheduled'
        ) as trips_count
    FROM 
        public.cities c
    WHERE 
        c.is_active = true
    ORDER BY 
        (
            SELECT COUNT(*) 
            FROM public.bookings b
            JOIN public.trips t ON b.trip_id = t.trip_id
            JOIN public.routes r ON t.route_id = r.route_id
            WHERE r.destination_city = c.name_ar
        ) DESC,
        c.name_ar ASC
    LIMIT 4;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_popular_destinations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_popular_destinations() TO anon;
