-- Fix RLS: Allow Partners to view bookings for their trips
-- This is required for the Booking Reports to show data for partners

CREATE POLICY "Partners can view bookings for their trips" ON public.bookings FOR SELECT USING (
    trip_id IN (
        SELECT trip_id FROM public.trips 
        WHERE partner_id IN (
            SELECT partner_id FROM public.users WHERE auth_id = auth.uid()
        )
    )
);
