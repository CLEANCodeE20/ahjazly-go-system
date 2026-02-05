import 'package:get/get.dart';
import '../controller/driver_dashboard_controller.dart';
import '../../../core/utils/error_handler.dart';
import '../domain/usecases/get_driver_settings_usecase.dart';
import '../domain/usecases/update_driver_settings_usecase.dart';

class DriverSettingsController extends GetxController {
  final GetDriverSettingsUseCase _getDriverSettingsUseCase = Get.find();
  final UpdateDriverSettingsUseCase _updateDriverSettingsUseCase = Get.find();
  final _dashboardController = Get.find<DriverDashboardController>();

  final isLoading = true.obs;
  
  // Settings observables
  final notificationsEnabled = true.obs;
  final trackLocation = true.obs;
  final autoAcceptTrips = false.obs;
  final language = 'ar'.obs;

  @override
  void onInit() {
    super.onInit();
    loadSettings();
  }

  Future<void> loadSettings() async {
    final driverId = _dashboardController.driver.value?.driverId;
    if (driverId == null) return;

    try {
      isLoading.value = true;
      final result = await _getDriverSettingsUseCase(driverId);
      
      result.fold(
        (failure) => ErrorHandler.showError('خطأ في تحميل الإعدادات: ${failure.message}'),
        (settings) {
          notificationsEnabled.value = settings.notificationsEnabled;
          // trackLocation and autoAcceptTrips are currently UI-only or handled differently in the entity
          // Assuming we might want to extend the entity later, but for now we map what exists
          language.value = settings.preferredLanguage ?? 'ar';
        }
      );
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> updateSetting(String key, dynamic value) async {
    final driverId = _dashboardController.driver.value?.driverId;
    if (driverId == null) return;

    try {
      final result = await _updateDriverSettingsUseCase(UpdateDriverSettingsParams(
        driverId: driverId,
        settings: {key: value},
      ));

      result.fold(
        (failure) => ErrorHandler.showError('فشل تحديث الإعداد: ${failure.message}'),
        (_) {
          // Success
        }
      );
    } catch (e) {
      ErrorHandler.showError('خطأ غير متوقع: $e');
    }
  }
}
