import 'package:get/get.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../utils/app_logger.dart';

class SystemSettingsService extends GetxService {
  final _client = Supabase.instance.client;
  
  final RxBool isMaintenanceMode = false.obs;
  final RxString minVersion = '1.0.0'.obs;
  final RxBool isLoading = true.obs;

  Future<SystemSettingsService> init() async {
    await fetchSettings();
    return this;
  }

  Future<void> fetchSettings() async {
    try {
      isLoading.value = true;
      AppLogger.info('Fetching System Settings...');
      
      final response = await _client
          .from('ui_site_settings')
          .select('key, value')
          .timeout(const Duration(seconds: 5));

      if (response != null && response is List) {
        for (var item in response) {
          final key = item['key']?.toString().toLowerCase();
          final value = item['value'];

          if (key == 'maintenance_mode') {
            isMaintenanceMode.value = (value == 'true' || value == true);
          } else if (key == 'app_min_version') {
            minVersion.value = value?.toString() ?? '1.0.0';
          }
        }
      }
      
      AppLogger.info('System Settings Synchronized. Maintenance: ${isMaintenanceMode.value}');
    } catch (e) {
      AppLogger.error('Failed to fetch system settings or timed out', error: e);
      // Fallback to defaults
      isMaintenanceMode.value = false;
    } finally {
      isLoading.value = false;
    }
  }
}
