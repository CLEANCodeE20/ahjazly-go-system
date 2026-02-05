import 'package:flutter/material.dart';
import 'package:flutter_otp_text_field/flutter_otp_text_field.dart';
import 'package:get/get.dart';

import '../../../../../core/constants/Color.dart';
import '../../../../../core/constants/images.dart';
import '../../../controller/VerificationCodeForgetController.dart';
import '../../widgets/ConstomCheckForget.dart';

class VerificationCodeForget extends StatelessWidget {
  const VerificationCodeForget({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.find<VerificationCodeForgetControllerImp>();

    return Scaffold(
      appBar: AppBar(
        title:  Text(
          '66'.tr,
          style: TextStyle(fontFamily: 'Cairo'),
        ),
        backgroundColor: AppColor.color_primary,
        centerTitle: true,
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 30),
        child: ListView(
          children: [
            ConstomCheckForget(
              nameimage: AppImage.image_forget,
              Text1: '67'.tr,
              Text2: '68'.tr,
              Text3: '',
            ),
            const SizedBox(height: 18),

            OtpTextField(
              numberOfFields: 6,
              borderWidth: 2,
              alignment: Alignment.center,
              borderRadius: BorderRadius.circular(12),
              borderColor: AppColor.color_primary,
              showFieldAsBox: true,
              onCodeChanged: (code) {
                if (controller.errorMessage.isNotEmpty) {
                  controller.errorMessage.value = '';
                }
              },
              onSubmit: (code) => controller.checkCode(code),
            ),

            const SizedBox(height: 20),

            Obx(
                  () => controller.errorMessage.isNotEmpty
                  ? Align(
                alignment: Alignment.center,
                child: Text(
                  controller.errorMessage.value,
                  style: const TextStyle(
                    color: Colors.red,
                    fontFamily: 'Cairo',
                  ),
                ),
              )
                  : const SizedBox.shrink(),
            ),

            const SizedBox(height: 20),

            // الكود القادم من السيرفر (Rx) داخل Obx
            Obx(
                  () => controller.serverCode.value.isNotEmpty
                  ? Center(
                child: Text(
                  "رمز التحقق (تجربة): ${controller.serverCode.value}",
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
