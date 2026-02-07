import 'package:get/get.dart';

import '../controller/BookingController.dart';

class BookingBinding extends Bindings {
  @override
  void dependencies() {
    // استخدم Get.lazyPut لإنشاء الـ ViewModel فقط عند فتح الصفحة الرئيسية
    Get.lazyPut<BookingController>(() => BookingController());
  }
}