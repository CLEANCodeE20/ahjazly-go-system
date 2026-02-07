import 'package:flutter/material.dart';
import 'package:get/get.dart';


import '../../../../../core/constants/Color.dart';
import '../../../../../core/constants/dimensions.dart';
import '../../../../../core/constants/images.dart';
import '../../../../../core/functions/validatorInput.dart';
import '../../../../../shared/widgets/custom_button_v2.dart';
import '../../../../../shared/widgets/input_field_builder.dart';
import '../../../controller/CheckEmail_Controller.dart';

import '../../widgets/ConstomCheckForget.dart';


class ForgetPassword extends StatelessWidget {
  const ForgetPassword({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.find<CheckEmailControllerImp>();

    return Scaffold(
      backgroundColor: AppColor.surface,
      appBar: AppBar(
        elevation: 0,
        centerTitle: true,
        title: Text(
          "33".tr,
          style: TextStyle(
            color: AppColor.color_primary,
            fontSize: AppDimensions.fontSizeXXLarge,
          ),
        ),
        backgroundColor: AppColor.surface,
        leading: IconButton(
          onPressed: () => Navigator.pop(context),
          icon: Icon(Icons.arrow_back_rounded, color: AppColor.color_primary),
        ),
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            ConstomCheckForget(
              nameimage: AppImage.image_forget,
              Text1: '33'.tr,
              Text2: '34'.tr,
              Text3: '',
            ),
            const SizedBox(height: 10),
            Padding(
              padding: const EdgeInsets.all(AppDimensions.paddingSmall),
              child: buildInputField(
                    (value) => validatorInput(value!, '16'.tr),
                controller.emailController,
                '9'.tr,
                Icons.email,
                false, readOnly: false,
              ),
            ),
            Obx(
                  () => controller.errorMessage.isNotEmpty
                  ? Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Text(
                  controller.errorMessage.value,
                  style: const TextStyle(color: Colors.red, fontFamily: 'Cairo'),
                ),
              )
                  : const SizedBox.shrink(),
            ),
            const SizedBox(height: 10),
            Obx(
                  () => Padding(
                padding: const EdgeInsets.all(AppDimensions.paddingSmall),
                child: WidegtBtuoon(
                  backgroundColor: AppColor.color_primary,
                  onPressed: controller.goToVerificationCode,
                  text: '39'.tr,
                  isLoading: controller.loading.value,
                ),
              ),
            )
          ],
        ),
      ),
    );
  }
}
