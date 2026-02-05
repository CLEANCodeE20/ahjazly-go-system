// file: view/screen/auth/login.dart (أو المسار الذي تستخدمه)

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl_phone_field/intl_phone_field.dart';
import 'package:intl_phone_field/phone_number.dart';


// 2. استيراد الـ Widgets المخصصة
import '../../../../core/constants/Color.dart';
import '../../../../core/constants/dimensions.dart';
import '../../../../core/constants/images.dart';
import '../../../../core/constants/nameRoute.dart';
import '../../../../core/functions/AlertExiteApp.dart';
import '../../../../core/functions/funaction_language.dart';
import '../../controller/AuthService.dart';
import '../../controller/login_controller.dart';


import '../widgets/LoginTypeTab.dart';
import '../../../../shared/widgets/input_field_builder.dart';
import '../../../../shared/widgets/custom_button_v2.dart';

class Login extends StatelessWidget {

  final LoginController controller = Get.find<LoginController>();

  Login({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColor.surface,
      body: WillPopScope(
        onWillPop: () => AlertExiteApp(),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              padding:  EdgeInsets.symmetric(horizontal: AppDimensions.paddingLarge, vertical: AppDimensions.paddingMedium),
              child: Form(
                key: controller.formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Align(
                      alignment: Alignment.topLeft,
                      child: IconButton(
                        icon: Icon(Icons.language, color: AppColor.color_primary, size: AppDimensions.iconSizeMedium),
                        onPressed: ()=>openLangSheet(),
                        tooltip: 'Change Language',
                      ),
                    ),
                     Container(
                       width: 250,
                       height: 80,
                       decoration: BoxDecoration(
                         image: DecorationImage(image: AssetImage(AppImage.image_logo,),fit:BoxFit.cover ,)
                       ),
                     ).animate().fadeIn(duration: 600.ms).scale(begin: const Offset(0.8, 0.8)),
                    SizedBox(height: 10,),

                    Text('7'.tr, style:  TextStyle(color: AppColor.color_primary, fontWeight: FontWeight.bold, fontSize: AppDimensions.fontSizeXXLarge, fontFamily: 'Cairo')).animate().fadeIn(delay: 200.ms).slideY(begin: 0.2, end: 0),
                    const SizedBox(height: 18),

                    Obx(() => Row(
                      children: [
                        LoginTypeTab(text: '8', isSelected:  controller.isPhoneLogin.value,onTap:  () => controller.toggleLoginType(true), borderRadius: AppDimensions.radiusXLarge,),
                        const SizedBox(width: 10),
                        LoginTypeTab(text: '9'.tr,isSelected: !controller.isPhoneLogin.value,onTap:  () => controller.toggleLoginType(false), borderRadius: AppDimensions.radiusXLarge),
                      ],
                    )).animate().fadeIn(delay: 400.ms).slideX(begin: -0.1, end: 0),
                    const SizedBox(height: 25),

                    Obx(() => controller.isPhoneLogin.value
                    // --- حقل الهاتف ---
                        ? IntlPhoneField(
                      controller: controller.phoneController,
                      decoration: InputDecoration(
                        labelText: '49'.tr,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(AppDimensions.radiusXLarge)),
                      ),
                      initialCountryCode: 'YE',
                      onChanged: (phone) => controller.countryISOCode.value = phone.countryISOCode,
                      validator:(PhoneNumber? phone) {

                        return controller.validatePhone(phone?.number);
              },
                    )
                    // --- حقل البريد الإلكتروني (باستخدام الـ Widget الخاص بك) ---
                        : buildInputField(
                      controller.validateEmail,
                      controller.emailController,
                      '9'.tr,
                      Icons.email_outlined,
                      false, readOnly: false,

                    )).animate().fadeIn(delay: 600.ms).slideY(begin: 0.1, end: 0),
                    const SizedBox(height: 18),

                    // --- حقل كلمة المرور (باستخدام الـ Widget الخاص بك) ---
                    Obx(() => buildInputField(
                      controller.validatePassword,
                      controller.passwordController,
                      '10'.tr,
                      Icons.lock_outline,
                      controller.obscurePassword.value,

                      suffixIcon: IconButton(
                        icon: Icon(
                          controller.obscurePassword.value ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                          color: AppColor.color_primary,
                        ),
                        onPressed: controller.togglePasswordVisibility,
                      ), readOnly: false,
                    )).animate().fadeIn(delay: 700.ms).slideY(begin: 0.1, end: 0),
                    const SizedBox(height: 12),

                    // --- رابط "نسيت كلمة المرور" ---
                    GestureDetector(
                      onTap: controller.goToForgotPassword,
                      child:  Align(
                          alignment: Alignment.centerRight,
                          child: Text('11'.tr, style: TextStyle(fontFamily: 'Cairo', color: AppColor.color_primary, fontWeight: FontWeight.w800))),
                    ),
                    const SizedBox(height: 28),

                    // --- زر تسجيل الدخول الرئيسي (مع مؤشر التحميل) ---
                    Obx(() {
                      final isLoading = controller.authStatus.value == UserStatus.loading;
                      return WidegtBtuoon(
                        text: "12".tr,
                        onPressed: controller.login,
                        backgroundColor: AppColor.color_primary,
                        isLoading: isLoading,
                      );
                    }).animate().fadeIn(delay: 800.ms).scale(begin: const Offset(0.9, 0.9)),
                    const SizedBox(height: 14),
                    // --- زر الدخول كزائر ---
                    WidegtBtuoon(
                      onPressed: () => Get.offAllNamed(AppRoute.MainController),
                      backgroundColor: AppColor.textPrimary,
                      text: '13'.tr,
                    ),
                    const SizedBox(height: 20),

                    // --- رابط إنشاء حساب جديد ---
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text('14'.tr, style: const TextStyle(fontFamily: 'Cairo',fontSize:AppDimensions.paddingMedium )),
                        const SizedBox(width: 3),
                        GestureDetector(
                          onTap: controller.goToSignUp,
                          child: Text('15'
                              ''.tr,
                              style:  TextStyle(color: AppColor.color_primary, decoration: TextDecoration.underline, fontFamily: 'Cairo', fontSize:AppDimensions.fontSizeMedium,fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

}
