-- =============================================
-- RATING SYSTEM RLS POLICIES
-- سياسات الأمان لنظام التقييم
-- =============================================

-- =============================================
-- RATINGS TABLE POLICIES
-- سياسات جدول التقييمات
-- =============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view visible ratings" ON public.ratings;
DROP POLICY IF EXISTS "Users can create ratings" ON public.ratings;

-- Policy 1: Anyone can view visible and verified ratings
CREATE POLICY "Public can view visible ratings"
ON public.ratings FOR SELECT
USING (is_visible = true);

-- Policy 2: Users can view their own ratings (even if not visible)
CREATE POLICY "Users can view their own ratings"
ON public.ratings FOR SELECT
USING (
    user_id IN (
        SELECT user_id FROM public.users WHERE auth_id = auth.uid()
    )
);

-- Policy 3: Partners can view ratings for their trips
CREATE POLICY "Partners can view their ratings"
ON public.ratings FOR SELECT
USING (
    partner_id IN (
        SELECT partner_id FROM public.users WHERE auth_id = auth.uid()
    )
);

-- Policy 4: Users can create ratings for their completed bookings
CREATE POLICY "Users can create ratings"
ON public.ratings FOR INSERT
WITH CHECK (
    user_id IN (
        SELECT user_id FROM public.users WHERE auth_id = auth.uid()
    )
    AND booking_id IN (
        SELECT b.booking_id 
        FROM public.bookings b
        JOIN public.trips t ON b.trip_id = t.trip_id
        WHERE b.user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid())
        AND b.booking_status = 'completed'
        AND t.status = 'completed'
    )
    AND NOT EXISTS (
        SELECT 1 FROM public.ratings r2 
        WHERE r2.booking_id = booking_id
    )
);

-- Policy 5: Users can update their own ratings within 7 days
CREATE POLICY "Users can update their own ratings"
ON public.ratings FOR UPDATE
USING (
    user_id IN (
        SELECT user_id FROM public.users WHERE auth_id = auth.uid()
    )
    AND rating_date >= NOW() - INTERVAL '7 days'
)
WITH CHECK (
    user_id IN (
        SELECT user_id FROM public.users WHERE auth_id = auth.uid()
    )
);

-- Policy 6: Admins can update any rating
CREATE POLICY "Admins can update ratings"
ON public.ratings FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE auth_id = auth.uid() 
        AND user_type = 'admin'
    )
);

-- Policy 7: Admins can delete ratings
CREATE POLICY "Admins can delete ratings"
ON public.ratings FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE auth_id = auth.uid() 
        AND user_type = 'admin'
    )
);

-- =============================================
-- RATING RESPONSES TABLE POLICIES
-- سياسات جدول ردود الشركاء
-- =============================================

-- Policy 1: Anyone can view visible responses
CREATE POLICY "Public can view visible responses"
ON public.rating_responses FOR SELECT
USING (is_visible = true);

-- Policy 2: Partners can view their own responses
CREATE POLICY "Partners can view their responses"
ON public.rating_responses FOR SELECT
USING (
    partner_id IN (
        SELECT partner_id FROM public.users WHERE auth_id = auth.uid()
    )
);

-- Policy 3: Partners can create responses to their ratings
CREATE POLICY "Partners can create responses"
ON public.rating_responses FOR INSERT
WITH CHECK (
    partner_id IN (
        SELECT partner_id FROM public.users WHERE auth_id = auth.uid()
    )
    AND rating_id IN (
        SELECT rating_id FROM public.ratings WHERE partner_id = rating_responses.partner_id
    )
    AND responder_user_id IN (
        SELECT user_id FROM public.users WHERE auth_id = auth.uid()
    )
);

-- Policy 4: Partners can update their own responses
CREATE POLICY "Partners can update their responses"
ON public.rating_responses FOR UPDATE
USING (
    partner_id IN (
        SELECT partner_id FROM public.users WHERE auth_id = auth.uid()
    )
)
WITH CHECK (
    partner_id IN (
        SELECT partner_id FROM public.users WHERE auth_id = auth.uid()
    )
);

-- Policy 5: Admins can manage all responses
CREATE POLICY "Admins can manage responses"
ON public.rating_responses FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE auth_id = auth.uid() 
        AND user_type = 'admin'
    )
);

-- =============================================
-- RATING HELPFULNESS TABLE POLICIES
-- سياسات جدول تقييم الفائدة
-- =============================================

-- Policy 1: Users can view all helpfulness votes
CREATE POLICY "Users can view helpfulness"
ON public.rating_helpfulness FOR SELECT
USING (true);

-- Policy 2: Authenticated users can mark ratings as helpful
CREATE POLICY "Users can mark helpful"
ON public.rating_helpfulness FOR INSERT
WITH CHECK (
    user_id IN (
        SELECT user_id FROM public.users WHERE auth_id = auth.uid()
    )
);

-- Policy 3: Users can update their own helpfulness votes
CREATE POLICY "Users can update their helpfulness"
ON public.rating_helpfulness FOR UPDATE
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

-- Policy 4: Users can delete their own helpfulness votes
CREATE POLICY "Users can delete their helpfulness"
ON public.rating_helpfulness FOR DELETE
USING (
    user_id IN (
        SELECT user_id FROM public.users WHERE auth_id = auth.uid()
    )
);

-- =============================================
-- RATING REPORTS TABLE POLICIES
-- سياسات جدول البلاغات
-- =============================================

-- Policy 1: Users can view their own reports
CREATE POLICY "Users can view their reports"
ON public.rating_reports FOR SELECT
USING (
    reporter_user_id IN (
        SELECT user_id FROM public.users WHERE auth_id = auth.uid()
    )
);

-- Policy 2: Admins can view all reports
CREATE POLICY "Admins can view all reports"
ON public.rating_reports FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE auth_id = auth.uid() 
        AND user_type = 'admin'
    )
);

-- Policy 3: Authenticated users can create reports
CREATE POLICY "Users can create reports"
ON public.rating_reports FOR INSERT
WITH CHECK (
    reporter_user_id IN (
        SELECT user_id FROM public.users WHERE auth_id = auth.uid()
    )
);

-- Policy 4: Admins can update reports (for review)
CREATE POLICY "Admins can update reports"
ON public.rating_reports FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE auth_id = auth.uid() 
        AND user_type = 'admin'
    )
);

-- =============================================
-- GRANT PERMISSIONS ON VIEWS
-- منح الصلاحيات على العروض
-- =============================================

GRANT SELECT ON public.v_partner_rating_stats TO authenticated;
GRANT SELECT ON public.v_driver_rating_stats TO authenticated;
GRANT SELECT ON public.v_top_rated_partners TO authenticated;
GRANT SELECT ON public.v_recent_ratings TO authenticated;
GRANT SELECT ON public.v_ratings_requiring_attention TO authenticated;
GRANT SELECT ON public.v_rating_trends_monthly TO authenticated;
GRANT SELECT ON public.v_rating_details TO authenticated;

-- =============================================
-- COMMENTS
-- التعليقات
-- =============================================

COMMENT ON POLICY "Public can view visible ratings" ON public.ratings IS 'الجميع يمكنهم مشاهدة التقييمات المرئية';
COMMENT ON POLICY "Users can create ratings" ON public.ratings IS 'المستخدمون يمكنهم إنشاء تقييمات لحجوزاتهم المكتملة فقط';
COMMENT ON POLICY "Partners can create responses" ON public.rating_responses IS 'الشركاء يمكنهم الرد على تقييماتهم فقط';
