import 'package:get/get.dart';
import 'package:flutter/material.dart';
import 'AuthService.dart';
import '../domain/usecases/verify_code_usecase.dart';

import '../../../core/constants/nameRoute.dart';




abstract class VerificationCodeForgetController extends GetxController {
  void checkCode(String code);
  void goToResetPassword(String token);
}

class VerificationCodeForgetControllerImp extends VerificationCodeForgetController {
  late String email;
  final serverCode = ''.obs;
  final errorMessage = ''.obs;
  final currentCode = ''.obs;
  final VerifyCodeUseCase _verifyCodeUseCase = Get.find();

  @override
  void onInit() {
    email = (Get.arguments['email'] ?? '').toString().trim().toLowerCase();
    super.onInit();
  }

  @override
  Future<void> checkCode(String code) async {
    errorMessage.value = '';
    currentCode.value = code;

    if (code.trim().isEmpty) {
      errorMessage.value = 'يرجى إدخال رمز التحقق.';
      currentCode.value = '';
      return;
    }

    print('🔍 DEBUG: VerificationCodeForgetController - Checking code: $code for email: $email');
    try {
      // Verify code using Clean Architecture Use Case
      final result = await _verifyCodeUseCase(VerifyCodeParams(email: email, code: code.trim()));
      
      bool isSuccess = false;
      result.fold(
        (failure) => errorMessage.value = failure.message,
        (success) => isSuccess = success,
      );
      
      if (isSuccess) {
         print('✅ DEBUG: VerificationCodeForgetController - Code verified! Navigating to ResetPassword');
         // Pass the code as token to the next screen
         goToResetPassword(code.trim());
      } else {
         errorMessage.value = 'رمز التحقق غير صحيح';
         currentCode.value = '';
      }
    } catch (e) {
      errorMessage.value = 'حدث خطأ: $e';
      currentCode.value = '';
    }
  }

  @override
  void goToResetPassword(String token) {
    Get.offNamed(
      AppRoute.ResetPassword,
      arguments: {
        "email": email,
        "reset_token": token
      },
    );
  }
}
