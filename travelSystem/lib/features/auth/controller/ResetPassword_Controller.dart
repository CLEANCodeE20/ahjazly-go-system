import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/constants/nameRoute.dart';
import 'AuthService.dart';
import '../domain/usecases/reset_password_usecase.dart';
import '../../../../core/error/failures.dart';

class ResetPasswordController extends GetxController {
  late String email;
  late String resetToken;
  final newPasswordController = TextEditingController();
  final confirmPasswordController = TextEditingController();
  final ResetPasswordUseCase _resetPasswordUseCase = Get.find();
  // Actually, I only need the UseCase.
  final errorMessage = ''.obs;
  final loading = false.obs;

  @override
  void onInit() {
    if (Get.arguments != null) {
      email = Get.arguments['email'] ?? '';
      resetToken = Get.arguments['reset_token'] ?? '';
    } else {
      email = '';
      resetToken = '';
    }
    super.onInit();
  }

  bool _validate() {
    errorMessage.value = '';
    final pass = newPasswordController.text.trim();
    final confirm = confirmPasswordController.text.trim();

    if (pass.isEmpty) {
      errorMessage.value = 'يرجى إدخال كلمة المرور الجديدة';
      return false;
    }

    if (pass.length < 6) {
      errorMessage.value = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
      return false;
    }

    if (!RegExp(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)').hasMatch(pass)) {
      errorMessage.value = 'كلمة المرور يجب أن تحتوي على حرف صغير، كبير، ورقم';
      return false;
    }

    if (confirm.isEmpty) {
      errorMessage.value = 'يرجى تأكيد كلمة المرور';
      return false;
    }

    if (pass != confirm) {
      errorMessage.value = 'كلمة المرور غير متطابقة';
      return false;
    }

    return true;
  }

  Future<void> resetPassword() async {
    if (!_validate()) return;

    loading.value = true;
    errorMessage.value = '';

    print('🔍 DEBUG: ResetPasswordController - Attempting reset for email: $email with token: $resetToken');
    try {
      final result = await _resetPasswordUseCase(ResetPasswordParams(
        email: email,
        code: resetToken,
        newPassword: newPasswordController.text.trim(),
      ));

      result.fold(
        (failure) {
          debugPrint('❌ Update Password Error: ${failure.message}');
          errorMessage.value = 'فشل في تحديث كلمة المرور: ${failure.message}';
        },
        (_) async {
          debugPrint('🎉 Password reset SUCCESS!');
          newPasswordController.clear();
          confirmPasswordController.clear();
          errorMessage.value = '';

          Get.snackbar(
            'تم بنجاح',
            'تم تحديث كلمة المرور بنجاح',
            snackPosition: SnackPosition.TOP,
            backgroundColor: Colors.green,
            colorText: Colors.white,
            duration: const Duration(seconds: 2),
          );

          await Future.delayed(const Duration(milliseconds: 1500));
          Get.offAllNamed(AppRoute.Login);
        },
      );

    } catch (e) {
      debugPrint('❌ Update Password Error: $e');
      errorMessage.value = 'فشل في تحديث كلمة المرور: $e';
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
