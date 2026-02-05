import 'package:get/get.dart';
import '../controller/driver_dashboard_controller.dart';
import '../controller/driver_trip_controller.dart';
import '../controller/driver_settings_controller.dart';
import '../controller/driver_documents_controller.dart';

class DriverBinding extends Bindings {
  @override
  void dependencies() {
    // Controllers (Use Cases are already in InjectionContainer)
    Get.lazyPut(() => DriverDashboardController());
    Get.lazyPut(() => DriverTripController());
    Get.lazyPut(() => DriverSettingsController());
    Get.lazyPut(() => DriverDocumentsController());
  }
}
