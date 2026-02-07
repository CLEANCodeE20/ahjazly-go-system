import 'package:get/get.dart';


import '../controller/login_controller.dart';

class LoginBinding extends Bindings {
  @override
  void dependencies() {
    // استخدم Get.lazyPut لإنشاء الـ Controller فقط عند الحاجة إليه
    Get.lazyPut<LoginController>(() => LoginController());
  }
}
