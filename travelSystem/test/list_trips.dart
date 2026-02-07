
import 'package:supabase_flutter/supabase_flutter.dart';

void main() async {
  const String url = "https://kbgbftyvbdgyoeosxlok.supabase.co";
  const String anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiZ2JmdHl2YmRneW9lb3N4bG9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1NzExMTcsImV4cCI6MjA4MjE0NzExN30.DZ8k_JWGR6eIeyCA9ZXAb5YuiEFxu2vAell67jEPUb4";

  final client = SupabaseClient(url, anonKey);

  try {
    final trips = await client.from('trips').select('''
      trip_id, 
      departure_time, 
      routes ( origin_city, destination_city ),
      buses ( bus_classes ( class_name ) )
    ''').limit(10);
    
    print('DB_TRIPS_START');
    for(var t in trips) {
      print("${t['trip_id']} | ${t['departure_time']} | ${t['routes']['origin_city']} -> ${t['routes']['destination_city']} | ${t['buses']['bus_classes']['class_name']}");
    }
    print('DB_TRIPS_END');
  } catch (e) {
    print('Error: $e');
  }
}
