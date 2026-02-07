import 'package:flutter/material.dart';
import 'package:flutter_otp_text_field/flutter_otp_text_field.dart';
import 'package:get/get.dart';
import 'package:travelsystem/core/constants/Color.dart';

import '../../controller/verification_code_signup_controller.dart';
import '../../../../core/constants/images.dart';
import '../widgets/ConstomCheckForget.dart';

class VerificationCodeSginup extends StatelessWidget {
  const VerificationCodeSginup({super.key});

  @override
  Widget build(BuildContext context) {
    final codeController = Get.put(VerificationCodeSignupController());

    return Scaffold(
      appBar: AppBar(
        title: const Text('التحقق من الحساب', style: TextStyle(fontFamily: 'Cairo')),
        backgroundColor: AppColor.color_primary,
        centerTitle: true,
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 30),
        child: ListView(
          children: [
            ConstomCheckForget(
              nameimage: AppImage.image_forget,
              Text1: 'رمز التحقق',
              Text2: 'أدخل الكود المرسل لبريدك الإلكتروني أو هاتفك',
              Text3: '',
            ),
            const SizedBox(height: 18),

            // حقل OTP مع إعادة التحقق ومسح الخانات عند الخطأ
            OtpTextField(
              numberOfFields: 6,
              borderWidth: 2,
              alignment: Alignment.center,
              borderRadius: BorderRadius.circular(12),
              borderColor: AppColor.color_primary,
              showFieldAsBox: true,
              // يجعل الحقول فارغة عند currentCode == ''

              onCodeChanged: (String code) {
                // عند الكتابة مرة أخرى نخفي رسالة الخطأ
                if (codeController.errorMessage.isNotEmpty) {
                  codeController.errorMessage.value = '';
                }
              },
              onSubmit: (String verificationCode) {
                codeController.checkVerificationCodeFromUI(verificationCode);
              },
            ),

            const SizedBox(height: 20),

            // رسالة الخطأ
            Obx(
                  () => codeController.errorMessage.isNotEmpty
                  ? Align(
                alignment: Alignment.center,
                child: Text(
                  codeController.errorMessage.value,
                  style: const TextStyle(
                    color: Colors.red,
                    fontFamily: 'Cairo',
                  ),
                ),
              )
                  : const SizedBox.shrink(),
            ),

            const SizedBox(height: 20),

            // إظهار كود التحقق القادم من السيرفر (للتجربة فقط)
            Obx(
                  () => codeController.verificationCodeFromServer.value.isNotEmpty
                  ? Center(
                child: Text(
                  "رمز التحقق (للتجربة): ${codeController.verificationCodeFromServer.value}",
                  style: const TextStyle(
                    fontFamily: 'Cairo',
                    color: Colors.grey,
                    fontSize: 14,
                  ),
                ),
              )
                  : const SizedBox.shrink(),
            ),
          ],
        ),
      ),
    );
  }
}
