
import 'package:supabase_flutter/supabase_flutter.dart';

void main() async {
  print("--- STARTING FULL SEARCH DIAGNOSTIC ---");
  const String url = "https://kbgbftyvbdgyoeosxlok.supabase.co";
  const String anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiZ2JmdHl2YmRneW9lb3N4bG9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1NzExMTcsImV4cCI6MjA4MjE0NzExN30.DZ8k_JWGR6eIeyCA9ZXAb5YuiEFxu2vAell67jEPUb4";

  final client = SupabaseClient(url, anonKey);
  
  // Date provided by user
  final date = '2025-12-27';
  
  // Permutations to test
  final cityPairs = [
    ['صنعاء', 'عدن'],
    ['Sana\'a', 'Aden'],
    ['Sanaa', 'Aden'],
    ['Sana', 'Aden'],
    ['صنعاء', 'إب'], // Testing other cities?
  ];
  
  final classes = ['VIP', 'vip', 'Standard', 'عادي', 'Business'];

  print("Testing connection...");
  try {
      // Just check if we can reach the server (any public table)
      await client.from('bus_classes').select().limit(1);
      print("Connection: OK");
  } catch(e) {
      print("Connection: FAILED ($e)");
      // Don't stop, maybe RPC works
  }

  var success = false;

  for (var pair in cityPairs) {
    for (var cls in classes) {
       final params = {
          '_from_stop': pair[0],
          '_to_city': pair[1],
          '_date': date,
          '_bus_class': cls
       };
       
       // print("Trying: ${pair[0]} -> ${pair[1]} | $cls | $date");
       
       try {
           final results = await client.rpc('search_trips', params: params);
           final list = results as List;
           if (list.isNotEmpty) {
               print("\n!!! SUCCESS !!! Found ${list.length} trip(s)");
               print("With Params: $params");
               print("Sample Data: ${list[0]}");
               success = true;
               break; 
           }
       } catch (e) {
           // print("RPC Error for $params: $e");
           if (e.toString().contains("function public.search_trips") && e.toString().contains("does not exist")) {
               print("CRITICAL: RPC function does not exist. Did you run the SQL?");
               return; 
           }
       }
    }
    if (success) break;
  }

  if (!success) {
      print("\nFAILURE: No trips found with any standard combination.");
      print("Likely causes:");
      print("1. RLS policies are still blocking (Did you add SECURITY DEFINER?)");
      print("2. Data names are very different (e.g. ' Sanaa ' with spaces)");
      print("3. Missing relations (Bus Class, Partner, or Bus not set for trip)");
  }
}
