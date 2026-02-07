import 'dart:typed_data';
import 'package:get/get.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseBookingService extends GetxService {
  final SupabaseClient _client = Supabase.instance.client;

  Future<String?> uploadIdImage(String fileName, Uint8List param1) async {
    try {
      final String path = 'ids/$fileName';
      await _client.storage.from('booking-documents').uploadBinary(
        path,
        param1,
        fileOptions: const FileOptions(upsert: true),
      );
      
      return _client.storage.from('booking-documents').getPublicUrl(path);
    } catch (e) {
      print('Error uploading ID image: $e');
      return null;
    }
  }
}
