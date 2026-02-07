import 'package:get/get.dart';
import '../controller/trip_controller.dart';

class TripBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<TripController>(() => TripController());
  }
}
