import 'package:get/get.dart';
import '../controller/home_section_controller.dart'; // تأكد من المسار

class HomeSectionBinding extends Bindings {
  @override
  void dependencies() {
    // قم بإنشاء HomeSectionController عند الحاجة إليه
    Get.lazyPut<HomeSectionController>(() => HomeSectionController());
  }
}
