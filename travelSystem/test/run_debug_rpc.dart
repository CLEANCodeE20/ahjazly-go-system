
import 'package:supabase_flutter/supabase_flutter.dart';

void main() async {
  print("--- RUNNING DEBUG RPC ---");
  const String url = "https://kbgbftyvbdgyoeosxlok.supabase.co";
  const String anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiZ2JmdHl2YmRneW9lb3N4bG9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1NzExMTcsImV4cCI6MjA4MjE0NzExN30.DZ8k_JWGR6eIeyCA9ZXAb5YuiEFxu2vAell67jEPUb4";

  final client = SupabaseClient(url, anonKey);

  try {
    final results = await client.rpc('get_trip_debug_info');
    final rows = results as List;
    
    if (rows.isEmpty) {
      print("No trips found in database.");
    } else {
      print("Found ${rows.length} latest trips:");
      for (var row in rows) {
        print("\nTrip ID: ${row['trip_id']}");
        print("  Time   : ${row['dep_time']}");
        print("  Origin : '${row['origin']}'");
        print("  Dest   : '${row['dest']}'");
        print("  Class  : '${row['bus_class']}'");
        print("  Partner: '${row['partner']}'");
        
        if (row['origin'] == 'MISSING_ROUTE') print("  >>> ERROR: Route ID is invalid or missing.");
        if (row['bus_class'] == 'MISSING_BUS_CLASS') print("  >>> ERROR: Bus ID or Class ID is invalid.");
      }
    }
  } catch (e) {
    print("Error calling debug RPC: $e");
  }
}
