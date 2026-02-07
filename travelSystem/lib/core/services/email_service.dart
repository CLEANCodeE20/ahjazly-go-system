import 'package:get/get.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class EmailService extends GetxService {
  final SupabaseClient _supabase = Supabase.instance.client;

  Future<bool> sendVerificationCode(String email, String name) async {
    try {
      // Call the Edge Function 'send-email'
      // Requires: supabase functions deploy send-email --no-verify-jwt
      final response = await _supabase.functions.invoke(
        'send-email',
        body: {
          "email": email,
          "name": name,
          // "code": code // REMOVED: Code is now generated securely on the server
        },
      );
      
      // If setup is correct, status 200 means success.
      // Note: invoke throws FunctionException on error usually, or returns data.
      // We assume success if no exception is thrown.
      print('Email sent successfully via Edge Function: ${response.data}');
      return true;

    } catch (e) {
      print('Error sending email via Edge Function: $e');
      if (e is FunctionException) {
         print('Function details: ${e.details}');
      }
      return false;
    }
  }
}
