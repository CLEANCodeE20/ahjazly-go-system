import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../../../core/constants/Color.dart';
import '../../../../../core/constants/dimensions.dart';
import '../../../../../core/constants/images.dart';
import '../../../../../shared/widgets/custom_button_v2.dart';
import '../../../controller/ResetPassword_Controller.dart';
import '../../widgets/ConstomCheckForget.dart';



class ResetPasswordPage extends StatelessWidget {
  const ResetPasswordPage({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.find<ResetPasswordController>();

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'تعيين كلمة مرور جديدة',
          style: TextStyle(fontFamily: 'Cairo'),
        ),
        backgroundColor: AppColor.color_primary,
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 30),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              ConstomCheckForget(
                nameimage: AppImage.image_forget,
                Text1: '35'.tr,
                Text2: '36'.tr,
                Text3: '',
              ),
              const SizedBox(height: 10),
               Text(
                '37'.tr,
                style: TextStyle(fontFamily: 'Cairo', fontSize: 16),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 30),
  
              TextField(
                controller: controller.newPasswordController,
                obscureText: true,
                decoration:  InputDecoration(
                  labelText: '65'.tr,
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
  
              TextField(
                controller: controller.confirmPasswordController,
                obscureText: true,
                decoration:  InputDecoration(
                  labelText: '32'.tr,
                  border: OutlineInputBorder(),
                ),
              ),
  
              const SizedBox(height: 16),
  
              // رسالة الخطأ
              Obx(
                    () => controller.errorMessage.isNotEmpty
                    ? Text(
                  controller.errorMessage.value,
                  style: const TextStyle(
                    color: Colors.red,
                    fontFamily: 'Cairo',
                  ),
                  textAlign: TextAlign.center,
                )
                    : const SizedBox.shrink(),
              ),
  
              const SizedBox(height: 30),
  
              Obx(
                    () => Padding(
                  padding: const EdgeInsets.all(AppDimensions.paddingSmall),
                  child: WidegtBtuoon(
                    backgroundColor: AppColor.color_primary,
                    onPressed: controller.resetPassword,
                    text: '39'.tr,
                    isLoading: controller.loading.value,
                  ),
                ),
              )
            ],
          ),
        ),
      ),
    );
  }
}
