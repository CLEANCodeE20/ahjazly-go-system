import 'package:get/get.dart';
import '../controllers/rating_controller.dart';

class CreateRatingBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<RatingController>(
      () => RatingController(),
    );
  }
}
