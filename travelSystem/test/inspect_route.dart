
import 'package:supabase_flutter/supabase_flutter.dart';

void main() async {
  const String url = "https://kbgbftyvbdgyoeosxlok.supabase.co";
  const String anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiZ2JmdHl2YmRneW9lb3N4bG9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1NzExMTcsImV4cCI6MjA4MjE0NzExN30.DZ8k_JWGR6eIeyCA9ZXAb5YuiEFxu2vAell67jEPUb4";

  final client = SupabaseClient(url, anonKey);

  try {
    // 1. Get latest trip
    final trips = await client.from('trips').select('''
      trip_id,
      route_id,
      routes ( origin_city, destination_city )
    ''').order('trip_id', ascending: false).limit(1);

    if (trips.isEmpty) {
        print("No trips found at all (RLS might be blocking raw table access).");
        return;
    }

    final trip = trips[0];
    final routeId = trip['route_id'];
    print("Latest Trip ID: ${trip['trip_id']}");
    print("Route ID: $routeId");
    print("Route Main: ${trip['routes']['origin_city']} -> ${trip['routes']['destination_city']}");

    // 2. Check Route Stops for this route
    print("\nChecking route_stops for Route ID $routeId...");
    final stops = await client.from('route_stops')
        .select('*')
        .eq('route_id', routeId)
        .order('stop_order');
    
    if (stops.isEmpty) {
        print("!!! WARNING: No route_stops found for this route. !!!");
        print("The search RPC relies on route_stops. If this table is empty, search will fail.");
    } else {
        print("Found ${stops.length} stops:");
        for(var s in stops) {
            print(" - [${s['stop_order']}] ${s['stop_name']}");
        }
    }

  } catch (e) {
    print('Error: $e');
  }
}
