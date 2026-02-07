import 'package:get/get.dart';
import 'package:flutter/material.dart';
import '../../../../core/constants/nameRoute.dart';
import 'AuthService.dart';

class VerificationCodeSignupController extends GetxController {
  String password = '';
  late String email;
  final verificationCodeFromServer = ''.obs;
  final errorMessage = ''.obs;
  final AuthService _authService = Get.find();

  @override
  void onInit() {
    if(Get.arguments != null){
       email = Get.arguments['email'];
       verificationCodeFromServer.value = Get.arguments['verification_code'].toString();
       password = Get.arguments['password'] ?? '';
    }
    super.onInit();
  }

  void checkVerificationCodeFromUI(String code) async {
    errorMessage.value = '';
    
    // Call Custom Verification (DB Check)
    // Note: If you are using Supabase Native OTP, use verifyEmailOtp.
    // Since we are using Brevo + Custom Code, we use verifyCustomCode
    final success = await _authService.verifyCustomCode(email, code);
    
    if (success) {
      Get.snackbar("نجاح", "تم التحقق من الحساب بنجاح", backgroundColor: Colors.green, colorText: Colors.white);
      
      // Auto Login (Native Supabase Login requires confirmed email, 
      // check if 'confirm email' is disabled in Supabase or if we just proceed)
      if (password.isNotEmpty) {
          await _authService.login(email, password);
      }
      
      Get.offAllNamed(AppRoute.MainController);
    } else {
      errorMessage.value = "رمز التحقق غير صحيح أو انتهت صلاحيته";
    }
  }
}
