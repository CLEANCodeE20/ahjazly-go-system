import 'package:get/get.dart';
import '../controller/main_view_model.dart';
import '../../booking/controller/user_bookings_controller.dart';
import '../../wallet/controller/wallet_controller.dart';

class HomeBinding extends Bindings {
  @override
  void dependencies() {
    // استخدم Get.lazyPut لإنشاء الـ ViewModel فقط عند فتح الصفحة الرئيسية
    Get.lazyPut<MainViewModel>(() => MainViewModel());
    Get.lazyPut<UserBookingsController>(() => UserBookingsController());
    Get.lazyPut<WalletController>(() => WalletController(), fenix: true);
  }
}
