
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
    try {
        console.log("⏰ Starting Scheduled Reminders Check...");

        // 1. Calculate time range: Now to Now + 24 hours
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        // 2. Query Bookings
        // - Trip departure is between now and tomorrow
        // - Booking status is confirmed/paid
        // - Not yet reminded (reminded_at is null)
        const { data: bookings, error } = await supabase
            .from("bookings")
            .select(`
        booking_id,
        auth_id,
        booking_status,
        trips!inner (
          trip_id,
          departure_time,
          routes (
            origin_city,
            destination_city
          )
        ),
        users (
          full_name
        )
      `)
            .in("booking_status", ["confirmed", "paid"])
            .is("reminded_at", null)
            .gt("trips.departure_time", now.toISOString())
            .lt("trips.departure_time", tomorrow.toISOString());

        if (error) throw error;

        console.log(`🔍 Found ${bookings?.length || 0} bookings to remind.`);

        const results = [];

        // 3. Process each booking
        if (bookings && bookings.length > 0) {
            for (const booking of bookings) {
                const trip = booking.trips;
                const route = trip.routes;
                const userName = booking.users?.full_name || "المسافر";

                // Format Date
                const depDate = new Date(trip.departure_time);
                const dateStr = depDate.toLocaleDateString('ar-SA');
                const timeStr = depDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

                // a. Insert Notification (This triggers the existing push notification system)
                const { error: notifyError } = await supabase
                    .from("notifications")
                    .insert({
                        auth_id: booking.auth_id, // Updated to auth_id
                        title: "تذكير بموعد الرحلة",
                        message: `مرحباً ${userName}، نذكرك بأن موعد رحلتك إلى ${route.destination_city} هو غداً ${dateStr} الساعة ${timeStr}. نتمنى لك رحلة آمنة!`,
                        type: "trip_reminder",
                        priority: "high"
                    });

                if (notifyError) {
                    console.error(`❌ Failed to notify booking ${booking.booking_id}:`, notifyError);
                    results.push({ id: booking.booking_id, status: "failed", error: notifyError });
                } else {
                    // b. Mark as Reminded
                    await supabase
                        .from("bookings")
                        .update({ reminded_at: new Date().toISOString() })
                        .eq("booking_id", booking.booking_id);

                    console.log(`✅ Reminded booking ${booking.booking_id}`);
                    results.push({ id: booking.booking_id, status: "success" });
                }
            }
        }

        return new Response(JSON.stringify({ success: true, processed: results.length }), {
            headers: { "Content-Type": "application/json" },
        });

    } catch (err: any) {
        console.error("❌ Error in schedule-reminders:", err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
});
