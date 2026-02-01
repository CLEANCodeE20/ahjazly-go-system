-- =============================================
-- Functions & RPCs لنظام السائقين
-- =============================================

-- =============================================
-- 1. دالة للتحقق من صلاحية السائق للرحلة
-- =============================================

CREATE OR REPLACE FUNCTION public.check_driver_trip_access(
    p_trip_id BIGINT,
    p_driver_id BIGINT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_driver_id BIGINT;
    v_trip_driver_id BIGINT;
BEGIN
    -- الحصول على driver_id من المستخدم الحالي إذا لم يتم تمريره
    IF p_driver_id IS NULL THEN
        SELECT driver_id INTO v_driver_id
        FROM public.drivers
        WHERE user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid())
        LIMIT 1;
    ELSE
        v_driver_id := p_driver_id;
    END IF;

    -- التحقق من أن الرحلة مخصصة لهذا السائق
    SELECT driver_id INTO v_trip_driver_id
    FROM public.trips
    WHERE trip_id = p_trip_id;

    RETURN v_driver_id = v_trip_driver_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 2. دالة لتحديث حالة الرحلة مع التسجيل
-- =============================================

CREATE OR REPLACE FUNCTION public.update_trip_status_by_driver(
    p_trip_id BIGINT,
    p_new_status VARCHAR(50),
    p_location_lat NUMERIC(10,8) DEFAULT NULL,
    p_location_lng NUMERIC(11,8) DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_driver_id BIGINT;
    v_user_id BIGINT;
    v_old_status VARCHAR(50);
    v_result JSONB;
BEGIN
    -- الحصول على معلومات السائق
    SELECT d.driver_id, u.user_id INTO v_driver_id, v_user_id
    FROM public.drivers d
    JOIN public.users u ON d.user_id = u.user_id
    WHERE u.auth_id = auth.uid()
    LIMIT 1;

    IF v_driver_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Driver not found'
        );
    END IF;

    -- التحقق من الصلاحية
    IF NOT public.check_driver_trip_access(p_trip_id, v_driver_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Unauthorized: This trip is not assigned to you'
        );
    END IF;

    -- الحصول على الحالة القديمة
    SELECT status INTO v_old_status
    FROM public.trips
    WHERE trip_id = p_trip_id;

    -- تحديث حالة الرحلة
    UPDATE public.trips
    SET status = p_new_status::trip_status,
        updated_at = NOW()
    WHERE trip_id = p_trip_id;

    -- تسجيل التغيير في السجل
    INSERT INTO public.trip_status_history (
        trip_id, driver_id, old_status, new_status,
        changed_by, location_lat, location_lng, notes
    ) VALUES (
        p_trip_id, v_driver_id, v_old_status, p_new_status,
        v_user_id, p_location_lat, p_location_lng, p_notes
    );

    -- إرسال إشعارات للركاب (يمكن إضافة logic هنا)
    -- TODO: Trigger notifications

    RETURN jsonb_build_object(
        'success', true,
        'trip_id', p_trip_id,
        'old_status', v_old_status,
        'new_status', p_new_status
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 3. دالة لتسجيل صعود راكب
-- =============================================

CREATE OR REPLACE FUNCTION public.log_passenger_boarding(
    p_passenger_id BIGINT,
    p_trip_id BIGINT,
    p_boarding_method VARCHAR(20) DEFAULT 'manual',
    p_location_lat NUMERIC(10,8) DEFAULT NULL,
    p_location_lng NUMERIC(11,8) DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_driver_id BIGINT;
BEGIN
    -- الحصول على driver_id
    SELECT driver_id INTO v_driver_id
    FROM public.drivers
    WHERE user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid())
    LIMIT 1;

    IF v_driver_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Driver not found');
    END IF;

    -- التحقق من الصلاحية
    IF NOT public.check_driver_trip_access(p_trip_id, v_driver_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
    END IF;

    -- تسجيل الصعود
    INSERT INTO public.passenger_boarding_log (
        passenger_id, trip_id, driver_id, boarding_method,
        location_lat, location_lng, notes
    ) VALUES (
        p_passenger_id, p_trip_id, v_driver_id, p_boarding_method,
        p_location_lat, p_location_lng, p_notes
    );

    -- تحديث حالة الراكب
    UPDATE public.passengers
    SET passenger_status = 'boarded'
    WHERE passenger_id = p_passenger_id;

    RETURN jsonb_build_object(
        'success', true,
        'passenger_id', p_passenger_id,
        'boarding_time', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 4. دالة للحصول على رحلات السائق
-- =============================================

CREATE OR REPLACE FUNCTION public.get_driver_trips(
    p_start_date DATE DEFAULT CURRENT_DATE,
    p_end_date DATE DEFAULT CURRENT_DATE,
    p_status TEXT DEFAULT NULL
)
RETURNS TABLE (
    trip_id BIGINT,
    route_id BIGINT,
    bus_id BIGINT,
    departure_time TIMESTAMP,
    arrival_time TIMESTAMP,
    status VARCHAR(50),
    base_price NUMERIC(10,2),
    origin_city VARCHAR(100),
    destination_city VARCHAR(100),
    bus_license_plate VARCHAR(50),
    passenger_count BIGINT
) AS $$
DECLARE
    v_driver_id BIGINT;
BEGIN
    -- الحصول على driver_id
    SELECT d.driver_id INTO v_driver_id
    FROM public.drivers d
    JOIN public.users u ON d.user_id = u.user_id
    WHERE u.auth_id = auth.uid()
    LIMIT 1;

    IF v_driver_id IS NULL THEN
        RAISE EXCEPTION 'Driver not found';
    END IF;

    RETURN QUERY
    SELECT 
        t.trip_id,
        t.route_id,
        t.bus_id,
        t.departure_time,
        t.arrival_time,
        t.status::VARCHAR(50),
        t.base_price,
        r.origin_city,
        r.destination_city,
        b.license_plate,
        COUNT(p.passenger_id) as passenger_count
    FROM public.trips t
    LEFT JOIN public.routes r ON t.route_id = r.route_id
    LEFT JOIN public.buses b ON t.bus_id = b.bus_id
    LEFT JOIN public.passengers p ON t.trip_id = p.trip_id
    WHERE t.driver_id = v_driver_id
        AND DATE(t.departure_time) BETWEEN p_start_date AND p_end_date
        AND (p_status IS NULL OR t.status::TEXT = p_status)
    GROUP BY t.trip_id, r.route_id, r.origin_city, r.destination_city, b.license_plate
    ORDER BY t.departure_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 5. دالة لحساب أداء السائق
-- =============================================

CREATE OR REPLACE FUNCTION public.calculate_driver_performance(
    p_driver_id BIGINT,
    p_period_start DATE,
    p_period_end DATE
)
RETURNS JSONB AS $$
DECLARE
    v_total_trips INTEGER;
    v_completed_trips INTEGER;
    v_cancelled_trips INTEGER;
    v_average_rating NUMERIC(3,2);
    v_on_time_trips INTEGER;
    v_result JSONB;
BEGIN
    -- حساب الإحصائيات
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'completed'),
        COUNT(*) FILTER (WHERE status = 'cancelled')
    INTO v_total_trips, v_completed_trips, v_cancelled_trips
    FROM public.trips
    WHERE driver_id = p_driver_id
        AND DATE(departure_time) BETWEEN p_period_start AND p_period_end;

    -- حساب متوسط التقييم
    SELECT AVG(stars)::NUMERIC(3,2)
    INTO v_average_rating
    FROM public.ratings
    WHERE driver_id = p_driver_id
        AND DATE(rating_date) BETWEEN p_period_start AND p_period_end;

    -- حفظ في جدول الأداء
    INSERT INTO public.driver_performance (
        driver_id, period_start, period_end,
        total_trips, completed_trips, cancelled_trips,
        average_rating, calculated_at
    ) VALUES (
        p_driver_id, p_period_start, p_period_end,
        v_total_trips, v_completed_trips, v_cancelled_trips,
        v_average_rating, NOW()
    )
    ON CONFLICT (driver_id, period_start, period_end)
    DO UPDATE SET
        total_trips = EXCLUDED.total_trips,
        completed_trips = EXCLUDED.completed_trips,
        cancelled_trips = EXCLUDED.cancelled_trips,
        average_rating = EXCLUDED.average_rating,
        calculated_at = NOW();

    RETURN jsonb_build_object(
        'total_trips', v_total_trips,
        'completed_trips', v_completed_trips,
        'cancelled_trips', v_cancelled_trips,
        'average_rating', v_average_rating
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 6. دالة لإنشاء سائق جديد مع حساب مستخدم
-- =============================================

-- Drop old signature to avoid ambiguity
DROP FUNCTION IF EXISTS public.create_driver_with_account(VARCHAR, VARCHAR, VARCHAR, BIGINT, VARCHAR, DATE, DATE);

CREATE OR REPLACE FUNCTION public.create_driver_with_account(
    p_full_name VARCHAR(255),
    p_email VARCHAR(255),
    p_phone_number VARCHAR(20),
    p_partner_id BIGINT,
    p_license_number VARCHAR(50),
    p_license_expiry DATE,
    p_hire_date DATE DEFAULT CURRENT_DATE,
    p_auth_id UUID DEFAULT NULL -- New parameter for Auth ID
)
RETURNS JSONB AS $$
DECLARE
    v_user_id BIGINT;
    v_driver_id BIGINT;
BEGIN
    -- إنشاء سجل المستخدم
    INSERT INTO public.users (
        full_name, email, phone_number,
        user_type, partner_id, account_status, auth_id -- Added auth_id column
    ) VALUES (
        p_full_name, p_email, p_phone_number,
        'driver', p_partner_id, 'active', p_auth_id -- Added auth_id value
    )
    RETURNING user_id INTO v_user_id;

    -- إنشاء سجل السائق
    INSERT INTO public.drivers (
        user_id, partner_id, full_name, phone_number,
        license_number, license_expiry, hire_date, status, auth_id -- Added auth_id
    ) VALUES (
        v_user_id, p_partner_id, p_full_name, p_phone_number,
        p_license_number, p_license_expiry, p_hire_date, 'active', p_auth_id -- Added auth_id value
    )
    RETURNING driver_id INTO v_driver_id;

    -- إنشاء إعدادات افتراضية
    INSERT INTO public.driver_settings (driver_id)
    VALUES (v_driver_id);

    RETURN jsonb_build_object(
        'success', true,
        'user_id', v_user_id,
        'driver_id', v_driver_id
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- COMMENTS للتوثيق
-- =============================================

COMMENT ON FUNCTION public.check_driver_trip_access IS 'التحقق من صلاحية السائق للوصول إلى رحلة معينة';
COMMENT ON FUNCTION public.update_trip_status_by_driver IS 'تحديث حالة الرحلة من قبل السائق مع التسجيل';
COMMENT ON FUNCTION public.log_passenger_boarding IS 'تسجيل صعود راكب على الحافلة';
COMMENT ON FUNCTION public.get_driver_trips IS 'الحصول على رحلات السائق لفترة محددة';
COMMENT ON FUNCTION public.calculate_driver_performance IS 'حساب أداء السائق لفترة محددة';
COMMENT ON FUNCTION public.create_driver_with_account IS 'إنشاء سائق جديد مع حساب مستخدم';
