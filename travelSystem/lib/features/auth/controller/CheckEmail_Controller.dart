import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../../core/services/email_service.dart';
import 'AuthService.dart';
import '../domain/usecases/check_email_usecase.dart';

import '../../../core/constants/nameRoute.dart';
import '../presentation/screens/forgetpassword/VerificationCodeForget.dart';


class CheckEmailControllerImp extends GetxController {
  final emailController = TextEditingController();
  final errorMessage = ''.obs;
  final loading = false.obs;
  final CheckEmailUseCase _checkEmailUseCase = Get.find();

  bool _validate() {
    errorMessage.value = '';
    final email = emailController.text.trim();
    if (email.isEmpty) {
      errorMessage.value = 'يرجى إدخال البريد الإلكتروني';
      return false;
    }
    if (!GetUtils.isEmail(email)) {
      errorMessage.value = 'البريد الإلكتروني غير صحيح';
      return false;
    }
    return true;
  }

  Future<void> goToVerificationCode() async {
    if (!_validate()) return;

    loading.value = true;
    errorMessage.value = '';
    
    try {
      final authService = Get.find<AuthService>();
      final emailService = Get.put(EmailService());
      final email = emailController.text.trim();

      debugPrint('Checking email: $email');

      // 1. Check if user exists using Clean Architecture Use Case
      final result = await _checkEmailUseCase(email);
      
      String? authId;
      result.fold(
        (failure) {
          errorMessage.value = 'البريد الإلكتروني غير مسجل في النظام أو حدث خطأ في الشبكة';
        },
        (id) => authId = id,
      );
      
      if (authId == null) {
        loading.value = false;
        return;
      }

      debugPrint('User found (auth_id: $authId). Sending code...');

      // 2. Send Request to Edge Function (Generates code & sends email)
      final success = await emailService.sendVerificationCode(email, "عميل عزيز");
      
      if (!success) {
        errorMessage.value = 'تعذر إرسال رمز التحقق. يرجى المحاولة لاحقاً';
        loading.value = false;
        return;
      }

      debugPrint('NAVIGATE TO: ${AppRoute.VerificationCodeForget}');
      
      Get.toNamed(
          AppRoute.VerificationCodeForget,
          arguments: {
            "email": email,
          }
      );
    } catch (e) {
      debugPrint('ForgotPassword Error: $e');
      errorMessage.value = 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى';
    } finally {
      loading.value = false;
    }
  }

  @override
  void onClose() {
    // TextEditingControllers are managed by Flutter widgets and GetX. 
    // Manual disposal here often causes "Used after disposed" errors during navigation animations.
    super.onClose();
  }
}
