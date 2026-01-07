-- ========================================================
-- DATABASE INDEXING OPTIMIZATION (PERFORMANCE BOOST)
-- ========================================================

-- Learn: Unindexed Foreign Keys and Search Fields cause "Sequential Scans" which are slow.
-- We adding B-Tree indexes to speed up filtering and joining.

-- 1. Bookings Table (Heavily queried)
CREATE INDEX IF NOT EXISTS idx_bookings_trip_id ON public.bookings(trip_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings(created_at);

-- 2. Trips Table
CREATE INDEX IF NOT EXISTS idx_trips_route_id ON public.trips(route_id);
CREATE INDEX IF NOT EXISTS idx_trips_bus_id ON public.trips(bus_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver_id ON public.trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_partner_id ON public.trips(partner_id);
CREATE INDEX IF NOT EXISTS idx_trips_departure_time ON public.trips(departure_time); -- Critical for sorting/filtering by date
CREATE INDEX IF NOT EXISTS idx_trips_status ON public.trips(status);

-- 3. Passengers Table
CREATE INDEX IF NOT EXISTS idx_passengers_booking_id ON public.passengers(booking_id);
CREATE INDEX IF NOT EXISTS idx_passengers_seat_id ON public.passengers(seat_id);

-- 4. Routes (Search optimizations)
CREATE INDEX IF NOT EXISTS idx_routes_cities ON public.routes(origin_city, destination_city);

-- 5. Audit Logs (For fast history lookup)
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON public.audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
