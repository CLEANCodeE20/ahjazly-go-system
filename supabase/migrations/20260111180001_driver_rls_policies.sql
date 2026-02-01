-- =============================================
-- RLS Policies لنظام السائقين
-- =============================================

-- =============================================
-- 1. Policies لجدول drivers
-- =============================================

-- السائق يمكنه رؤية بياناته الخاصة
DROP POLICY IF EXISTS "Drivers can view own data" ON public.drivers;
CREATE POLICY "Drivers can view own data"
ON public.drivers FOR SELECT
TO authenticated
USING (
    user_id IN (
        SELECT user_id FROM public.users WHERE auth_id = auth.uid()
    )
);

-- السائق يمكنه تحديث بياناته الشخصية (محدودة)
DROP POLICY IF EXISTS "Drivers can update own data" ON public.drivers;
CREATE POLICY "Drivers can update own data"
ON public.drivers FOR UPDATE
TO authenticated
USING (
    user_id IN (
        SELECT user_id FROM public.users WHERE auth_id = auth.uid()
    )
)
WITH CHECK (
    user_id IN (
        SELECT user_id FROM public.users WHERE auth_id = auth.uid()
    )
);

-- الشركاء يمكنهم رؤية سائقيهم
DROP POLICY IF EXISTS "Partners can view their drivers" ON public.drivers;
CREATE POLICY "Partners can view their drivers"
ON public.drivers FOR SELECT
TO authenticated
USING (
    partner_id IN (
        SELECT partner_id FROM public.users WHERE auth_id = auth.uid()
    )
);

-- =============================================
-- 2. Policies لجدول driver_settings
-- =============================================

-- السائق يمكنه رؤية وتعديل إعداداته
DROP POLICY IF EXISTS "Drivers can manage own settings" ON public.driver_settings;
CREATE POLICY "Drivers can manage own settings"
ON public.driver_settings FOR ALL
TO authenticated
USING (
    driver_id IN (
        SELECT driver_id FROM public.drivers 
        WHERE user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid())
    )
)
WITH CHECK (
    driver_id IN (
        SELECT driver_id FROM public.drivers 
        WHERE user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid())
    )
);

-- =============================================
-- 3. Policies لجدول driver_performance
-- =============================================

-- السائق يمكنه رؤية أدائه
DROP POLICY IF EXISTS "Drivers can view own performance" ON public.driver_performance;
CREATE POLICY "Drivers can view own performance"
ON public.driver_performance FOR SELECT
TO authenticated
USING (
    driver_id IN (
        SELECT driver_id FROM public.drivers 
        WHERE user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid())
    )
);

-- الشركاء يمكنهم رؤية أداء سائقيهم
DROP POLICY IF EXISTS "Partners can view drivers performance" ON public.driver_performance;
CREATE POLICY "Partners can view drivers performance"
ON public.driver_performance FOR SELECT
TO authenticated
USING (
    driver_id IN (
        SELECT driver_id FROM public.drivers 
        WHERE partner_id IN (
            SELECT partner_id FROM public.users WHERE auth_id = auth.uid()
        )
    )
);

-- =============================================
-- 4. Policies لجدول driver_documents
-- =============================================

-- السائق يمكنه رؤية مستنداته
DROP POLICY IF EXISTS "Drivers can view own documents" ON public.driver_documents;
CREATE POLICY "Drivers can view own documents"
ON public.driver_documents FOR SELECT
TO authenticated
USING (
    driver_id IN (
        SELECT driver_id FROM public.drivers 
        WHERE user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid())
    )
);

-- السائق يمكنه رفع مستندات جديدة
DROP POLICY IF EXISTS "Drivers can upload documents" ON public.driver_documents;
CREATE POLICY "Drivers can upload documents"
ON public.driver_documents FOR INSERT
TO authenticated
WITH CHECK (
    driver_id IN (
        SELECT driver_id FROM public.drivers 
        WHERE user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid())
    )
);

-- الشركاء يمكنهم رؤية مستندات سائقيهم
DROP POLICY IF EXISTS "Partners can view drivers documents" ON public.driver_documents;
CREATE POLICY "Partners can view drivers documents"
ON public.driver_documents FOR SELECT
TO authenticated
USING (
    driver_id IN (
        SELECT driver_id FROM public.drivers 
        WHERE partner_id IN (
            SELECT partner_id FROM public.users WHERE auth_id = auth.uid()
        )
    )
);

-- =============================================
-- 5. Policies لجدول trips (تحديث للسائقين)
-- =============================================

-- السائق يمكنه رؤية رحلاته فقط
DROP POLICY IF EXISTS "Drivers can view own trips" ON public.trips;
CREATE POLICY "Drivers can view own trips"
ON public.trips FOR SELECT
TO authenticated
USING (
    driver_id IN (
        SELECT driver_id FROM public.drivers 
        WHERE user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid())
    )
);

-- السائق يمكنه تحديث حالة رحلاته فقط
DROP POLICY IF EXISTS "Drivers can update own trips status" ON public.trips;
CREATE POLICY "Drivers can update own trips status"
ON public.trips FOR UPDATE
TO authenticated
USING (
    driver_id IN (
        SELECT driver_id FROM public.drivers 
        WHERE user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid())
    )
)
WITH CHECK (
    driver_id IN (
        SELECT driver_id FROM public.drivers 
        WHERE user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid())
    )
);

-- =============================================
-- 6. Policies لجدول trip_status_history
-- =============================================

-- السائق يمكنه رؤية سجل رحلاته
DROP POLICY IF EXISTS "Drivers can view own trip history" ON public.trip_status_history;
CREATE POLICY "Drivers can view own trip history"
ON public.trip_status_history FOR SELECT
TO authenticated
USING (
    driver_id IN (
        SELECT driver_id FROM public.drivers 
        WHERE user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid())
    )
);

-- السائق يمكنه إضافة سجلات لرحلاته
DROP POLICY IF EXISTS "Drivers can add trip history" ON public.trip_status_history;
CREATE POLICY "Drivers can add trip history"
ON public.trip_status_history FOR INSERT
TO authenticated
WITH CHECK (
    driver_id IN (
        SELECT driver_id FROM public.drivers 
        WHERE user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid())
    )
);

-- =============================================
-- 7. Policies لجدول passenger_boarding_log
-- =============================================

-- السائق يمكنه رؤية سجل صعود ركاب رحلاته
DROP POLICY IF EXISTS "Drivers can view boarding logs" ON public.passenger_boarding_log;
CREATE POLICY "Drivers can view boarding logs"
ON public.passenger_boarding_log FOR SELECT
TO authenticated
USING (
    driver_id IN (
        SELECT driver_id FROM public.drivers 
        WHERE user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid())
    )
);

-- السائق يمكنه تسجيل صعود الركاب
DROP POLICY IF EXISTS "Drivers can log passenger boarding" ON public.passenger_boarding_log;
CREATE POLICY "Drivers can log passenger boarding"
ON public.passenger_boarding_log FOR INSERT
TO authenticated
WITH CHECK (
    driver_id IN (
        SELECT driver_id FROM public.drivers 
        WHERE user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid())
    )
);

-- =============================================
-- 8. Policies لجدول passengers (للسائقين)
-- =============================================

-- السائق يمكنه رؤية ركاب رحلاته
DROP POLICY IF EXISTS "Drivers can view trip passengers" ON public.passengers;
CREATE POLICY "Drivers can view trip passengers"
ON public.passengers FOR SELECT
TO authenticated
USING (
    trip_id IN (
        SELECT trip_id FROM public.trips 
        WHERE driver_id IN (
            SELECT driver_id FROM public.drivers 
            WHERE user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid())
        )
    )
);

-- =============================================
-- COMMENTS للتوثيق
-- =============================================

COMMENT ON POLICY "Drivers can view own data" ON public.drivers IS 'السائق يرى بياناته الشخصية فقط';
COMMENT ON POLICY "Drivers can view own trips" ON public.trips IS 'السائق يرى رحلاته المخصصة له فقط';
COMMENT ON POLICY "Drivers can update own trips status" ON public.trips IS 'السائق يمكنه تحديث حالة رحلاته فقط';
