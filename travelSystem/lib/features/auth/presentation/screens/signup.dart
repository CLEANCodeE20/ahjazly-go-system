import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl_phone_field/intl_phone_field.dart';

import '../../../../core/constants/Color.dart';
import '../../../../core/constants/dimensions.dart';
import '../../../../core/functions/validatorInput.dart';
import '../../controller/AuthService.dart';
import '../../controller/signup_controller.dart';

import '../../../../shared/widgets/input_field_builder.dart';
import 'package:travelsystem/core/constants/images.dart';

import '../../../../shared/widgets/custom_button_v2.dart';

class Sginup extends StatelessWidget {
  final RegisterController controller = Get.find<RegisterController>();


  static const String maleKey = "M";
  static const String femaleKey = "F";

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor:AppColor.surface,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding:  EdgeInsets.symmetric(horizontal: AppDimensions.paddingMedium, vertical: AppDimensions.paddingMedium),
            child: Form(
              key: controller.formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  // شعار أعلى الصفحة مثل صفحة تسجيل الدخول
                  Container(
                    margin: const EdgeInsets.all(AppDimensions.paddingMedium),
                    height: 100,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      image: DecorationImage(
                        image: AssetImage(AppImage.image_logo),
                        fit: BoxFit.cover,
                      ),
                      borderRadius: BorderRadius.circular(AppDimensions.radiusXXLarge),
                    ),
                  ).animate().fadeIn(duration: 600.ms).scale(begin: const Offset(0.8, 0.8)),
                  SizedBox(height: 30),

                  Text('29'.tr,
                      style: TextStyle(
                          color: AppColor.color_primary,
                          fontWeight: FontWeight.bold,
                          fontSize: AppDimensions.fontSizeHeadline,
                          fontFamily: 'Cairo')).animate().fadeIn(delay: 200.ms).slideY(begin: 0.2, end: 0),
                  SizedBox(height: 22),

                  buildInputField(
                        (value) => validatorInput(value!, '22'.tr),
                    controller.fullNameController,
                    '30'.tr,
                    Icons.person,
                    false, readOnly: false,

                  ).animate().fadeIn(delay: 300.ms).slideX(begin: 0.1, end: 0),
                  SizedBox(height: 16),

                  // اختيار الجنس
                  Align(
                    alignment: Alignment.centerRight,
                    child: Text(
                      '31'.tr,
                      style: TextStyle(
                          fontSize: AppDimensions.fontSizeLarge, fontFamily: 'Cairo', fontWeight: FontWeight.bold),
                    ),
                  ),
                  Obx(() => Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      Row(
                        children: [
                          Radio<Gender>(
                            activeColor: AppColor.color_primary,
                            value: Gender.male,
                            groupValue: controller.gender.value,
                            onChanged: (val) => controller.gender.value = val!,
                          ),
                          Text('27'.tr, style: TextStyle(fontFamily: 'Cairo',fontSize: AppDimensions.fontSizeLarge)), // ذكر
                        ],
                      ),
                      SizedBox(width: 20),
                      Row(
                        children: [
                          Radio<Gender>(
                            activeColor: AppColor.color_primary,
                            value: Gender.female,
                            groupValue: controller.gender.value,
                            onChanged: (val) => controller.gender.value = val!,
                          ),
                          Text('28'.tr, style: TextStyle(fontFamily: 'Cairo',fontSize:AppDimensions.fontSizeLarge)), // أنثى
                        ],
                      ),
                    ],
                  )).animate().fadeIn(delay: 400.ms).slideX(begin: 0.1, end: 0),

                  SizedBox(height: 16),
                  buildInputField(
                        (value) => validatorInput(value!, '16'.tr),
                    controller.emailController,
                    '9'.tr,
                    Icons.email,
                    false, readOnly: false,
                  ).animate().fadeIn(delay: 500.ms).slideX(begin: 0.1, end: 0),
                  SizedBox(height: 16),

                  Column(
                    children: [
                      IntlPhoneField(
                        decoration: InputDecoration(
                          labelText: '49'.tr,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(AppDimensions.radiusXLarge),
                          ),
                          contentPadding: EdgeInsets.symmetric(horizontal: AppDimensions.paddingMedium, vertical: AppDimensions.paddingMedium),
                        ),
                        initialCountryCode: 'YE',
                        onChanged: (phone) {
                          controller.phoneNumber.value = phone.number;
                          controller.countryISOCode.value = phone.countryISOCode;
                        },
                      ),
                    ],
                  ).animate().fadeIn(delay: 600.ms).slideX(begin: 0.1, end: 0),
                  SizedBox(height: 16),

                  Obx(() => buildInputField(
                        (value) => validatorInput(value!, '18'.tr),
                    controller.passwordController,
                    '10'.tr,
                    Icons.lock,
                    controller.obscurePassword.value,

                    suffixIcon: IconButton(
                      icon: Icon(
                        controller.obscurePassword.value
                            ? Icons.visibility
                            : Icons.visibility_off,
                        color: Colors.grey,
                      ),
                      onPressed: controller.togglePasswordVisibility,
                    ), readOnly: false,
                  )).animate().fadeIn(delay: 700.ms).slideX(begin: 0.1, end: 0),
                  SizedBox(height: 16),
                  Obx(() => buildInputField(
                        (value) => validatorInput(value!, '15'.tr),
                    controller.confirmPasswordController,
                    '32'.tr,
                    Icons.lock_outline,
                    controller.obscureConfirmPassword.value,

                    suffixIcon: IconButton(
                      icon: Icon(
                        controller.obscureConfirmPassword.value
                            ? Icons.visibility
                            : Icons.visibility_off,
                        color: Colors.grey,
                      ),
                      onPressed: controller.toggleConfirmPasswordVisibility,
                    ), readOnly: false,
                  )).animate().fadeIn(delay: 800.ms).slideX(begin: 0.1, end: 0),
                  SizedBox(height: 20),

                  // رسالة الخطأ
                  Obx(() => controller.errorMessage.isNotEmpty
                      ? Align(
                    alignment: Alignment.centerRight,
                    child: Text(
                      controller.errorMessage.value,
                      style: TextStyle(color: Colors.red, fontSize: 13, fontFamily: 'Cairo'),
                    ),
                  ).animate().shake(duration: 400.ms)
                      : SizedBox.shrink()
                  ),
                  SizedBox(height: 20),
                  Obx(() {
                    final isLoading = controller.authStatus.value == UserStatus.loading;
                    return WidegtBtuoon(
                      backgroundColor: AppColor.color_primary,
                      onPressed: controller.register,
                      text: '29'.tr,
                      isLoading: isLoading,
                    );
                  }).animate().fadeIn(delay: 900.ms).scale(begin: const Offset(0.9, 0.9)),

                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
