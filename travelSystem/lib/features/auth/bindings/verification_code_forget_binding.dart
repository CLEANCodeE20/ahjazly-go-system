import 'package:get/get.dart';
import '../controller/VerificationCodeForgetController.dart';

class VerificationCodeForgetBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<VerificationCodeForgetControllerImp>(() => VerificationCodeForgetControllerImp());
  }
}
