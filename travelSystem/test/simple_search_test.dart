
import 'package:supabase_flutter/supabase_flutter.dart';

void main() async {
  print('Connecting to Supabase...');
  
  // Hardcoded config from inspected file
  const String url = "https://kbgbftyvbdgyoeosxlok.supabase.co";
  const String anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiZ2JmdHl2YmRneW9lb3N4bG9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1NzExMTcsImV4cCI6MjA4MjE0NzExN30.DZ8k_JWGR6eIeyCA9ZXAb5YuiEFxu2vAell67jEPUb4";

  // Use Client directly to avoid SharedPreferences dependency
  final client = SupabaseClient(url, anonKey);

  print('Listing first 5 trips to inspect data structure:');
  try {
    final trips = await client.from('trips').select('''
      trip_id, 
      departure_time, 
      routes ( origin_city, destination_city ),
      buses ( bus_classes ( class_name ) )
    ''').limit(5);
    
    print('Found ${trips.length} trips:');
    for(var t in trips) {
      print(t);
    }
  } catch (e) {
    print('Error fetching raw trips: $e');
  }

  print('\nTesting RPC search_trips with likely params:');
  // Param format based on BookingController
  final params = {
    '_from_stop': 'صنعاء', 
    '_to_city': 'عدن',
    '_date': DateTime.now().toIso8601String().split('T')[0], // Today
    '_bus_class': 'vip'
  };
  
  print('Params: $params');

  try {
    final results = await client.rpc('search_trips', params: params);
    print('RPC Results count: ${(results as List).length}');
    if ((results as List).isNotEmpty) {
      print(results[0]);
    }
  } catch (e) {
    print('RPC Error: $e');
  }
}
