
import 'package:supabase_flutter/supabase_flutter.dart';

void main() async {
  const String url = "https://kbgbftyvbdgyoeosxlok.supabase.co";
  const String anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiZ2JmdHl2YmRneW9lb3N4bG9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1NzExMTcsImV4cCI6MjA4MjE0NzExN30.DZ8k_JWGR6eIeyCA9ZXAb5YuiEFxu2vAell67jEPUb4";

  final client = SupabaseClient(url, anonKey);

  print('STRATEGY: Listing ANY trips for Today to see what matches...');
  
  try {
    final today = DateTime.now().toIso8601String().split('T')[0];
    print("Checking for date: $today");

    // Fetch *RAW* trips for today, ignoring other filters
    final trips = await client.from('trips').select('''
      trip_id,
      departure_time,
      routes ( origin_city, destination_city ),
      buses ( bus_classes ( class_name ) )
    ''')
    //.ilike('departure_time', '$today%') // Supabase doesn't support ilike on timestamp easily this way
    .limit(10);
    
    // We'll filter in code just to see
    var found = 0;
    for(var t in trips) {
      if (t['departure_time'].toString().startsWith(today)) {
         print("MATCH TODAY: ${t['routes']['origin_city']} -> ${t['routes']['destination_city']} [${t['buses']['bus_classes']['class_name']}]");
         found++;
      } else {
         print("OTHER DATE: ${t['departure_time']} | ${t['routes']['origin_city']} -> ${t['routes']['destination_city']} [${t['buses']['bus_classes']['class_name']}]");
      }
    }
    
    if (found == 0) {
      print("WARNING: No trips found for today ($today) in the first 10 rows.");
    }

  } catch (e) {
    print('Error: $e');
  }
}
