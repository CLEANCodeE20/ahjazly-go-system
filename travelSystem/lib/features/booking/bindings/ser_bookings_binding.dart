// lib/bindings/user_bookings_binding.dart
import 'package:get/get.dart';
import '../controller/user_bookings_controller.dart';

class UserBookingsBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<UserBookingsController>(() => UserBookingsController());
  }
}
