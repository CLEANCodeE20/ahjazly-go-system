import 'package:flutter/material.dart';
import 'package:get/get.dart';


import '../../../core/classes/StatusRequest.dart';
import '../../../core/constants/Color.dart';
import '../../../core/constants/images.dart';
import '../../../core/functions/checkEnternet.dart';
import '../../auth/controller/AuthService.dart';


class UpdeatDataUserController extends GetxController{

  final AuthService _authService = Get.find();
  final obscurePassword = true.obs;
  final obscureConfirmPassword = true.obs;
  final requst = StatRequst.succes.obs;

  Rx<UserStatus> get authStatus => _authService.userStatus;
  void togglePasswordVisibility() {
    obscurePassword.value = !obscurePassword.value;
  }
  void toggleConfirmPasswordVisibility() =>
      obscureConfirmPassword.value = !obscureConfirmPassword.value;

  Future<void> updaetdata() async {
    if (!await checkInternet()) {
      requst.value = StatRequst.noInternet;
      Get.snackbar('تنبيه', 'لا يوجد اتصال بالإنترنت');
      return;
    }
    
    requst.value = StatRequst.Loding;
    // هنا يمكنك إضافة منطق الاتصال بالـ API لتحديث البيانات
    await Future.delayed(Duration(seconds: 1)); // محاكاة للاتصال
    requst.value = StatRequst.succes;
    Get.snackbar(
      'رساله',
      'تم تعديل بياناتك بنجاح',
      snackPosition: SnackPosition.TOP,
      icon: Image(image: AssetImage(AppImage.image_success)) ,
      backgroundColor: AppColor.color_secondary.withOpacity(0.9),
      colorText: AppColor.success,
    );
  }
}