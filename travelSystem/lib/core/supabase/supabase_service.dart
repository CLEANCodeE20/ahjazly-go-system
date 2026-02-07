import 'package:get/get.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'supabase_config.dart';
import 'secure_local_storage.dart';

class SupabaseService extends GetxService {
  late final SupabaseClient client;

  Future<SupabaseService> init() async {
    await Supabase.initialize(
      url: SupabaseConfig.url,
      anonKey: SupabaseConfig.anonKey,
      authOptions: FlutterAuthClientOptions(
        localStorage: const SecureLocalStorage(),
      ),
    );
    client = Supabase.instance.client;
    return this;
  }

  // Helper instance
  static SupabaseClient get to => Get.find<SupabaseService>().client;
}
