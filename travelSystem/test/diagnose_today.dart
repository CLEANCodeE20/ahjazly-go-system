
import 'package:supabase_flutter/supabase_flutter.dart';

void main() async {
  const String url = "https://kbgbftyvbdgyoeosxlok.supabase.co";
  const String anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiZ2JmdHl2YmRneW9lb3N4bG9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1NzExMTcsImV4cCI6MjA4MjE0NzExN30.DZ8k_JWGR6eIeyCA9ZXAb5YuiEFxu2vAell67jEPUb4";

  final client = SupabaseClient(url, anonKey);
  
  // The date user mentioned
  final targetDate = '2025-12-27';
  print("DIAGNOSTIC: Searching for trips on $targetDate");

  try {
    // 1. Fetch RAW trips for this date (ignoring city/class filters) to see what exists
    final trips = await client.from('trips').select('''
      trip_id,
      departure_time,
      base_price,
      routes ( 
        origin_city, 
        destination_city,
        route_stops ( stop_name, stop_order )
      ),
      buses ( 
        bus_classes ( class_name ) 
      )
    ''').order('trip_id', ascending: false).limit(20);

    var matchingDateCount = 0;
    
    for (var t in trips) {
      final depTime = t['departure_time'].toString();
      // Print EVERYTHING
      print("\n--- TRIP ID: ${t['trip_id']} ---");
      print("Raw Time: '$depTime'");
      
      final busClass = t['buses'] != null && t['buses']['bus_classes'] != null 
          ? t['buses']['bus_classes']['class_name'] 
          : 'UNKNOWN';
      print("Bus Class: '$busClass'");
      
      final r = t['routes'];
      if(r != null) {
          print("Route: '${r['origin_city']}' -> '${r['destination_city']}'");
      }
    }

    if (matchingDateCount == 0) {
      print("\nNO TRIPS found for date $targetDate in the first 20 rows.");
      print("First few rows timestamps:");
      for(var t in trips) {
        print(t['departure_time']);
      }
    }
    
    print("\n--- Direct RPC Test ---");
    // Test exact RPC call with likely values
    final params = {
      '_from_stop': 'صنعاء',
      '_to_city': 'عدن',
      '_date': targetDate,
      '_bus_class': 'VIP'
    };
    print("Function Params: $params");
    
    try {
      final rpcResult = await client.rpc('search_trips', params: params);
      print("RPC returned ${(rpcResult as List).length} results.");
    } catch(e) {
      print("RPC Failed: $e");
    }

  } catch (e) {
    print('Error: $e');
  }
}
