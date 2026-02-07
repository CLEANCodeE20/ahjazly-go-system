import 'package:get/get.dart';


import '../../trips/presentation/screens/create_rating_page.dart';
import '../controller/BookingController.dart';

class CreateRatingBinding extends Bindings {
  @override
  void dependencies() {
    // استخدم Get.lazyPut لإنشاء الـ ViewModel فقط عند فتح الصفحة الرئيسية
    Get.lazyPut<CreateRatingPage>(() => CreateRatingPage());
  }
}