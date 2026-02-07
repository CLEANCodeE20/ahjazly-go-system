import 'package:get/get.dart';
import '../controller/CheckEmail_Controller.dart';

class ForgetPasswordBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<CheckEmailControllerImp>(() => CheckEmailControllerImp());
  }
}
