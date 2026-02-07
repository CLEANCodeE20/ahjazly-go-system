// file: controllers/login_controller.dart

import 'package:flutter/material.dart';
import 'package:get/get.dart';


import '../../../core/constants/nameRoute.dart';
import '../../../core/functions/checkEnternet.dart';
import 'AuthService.dart';
import '../domain/usecases/login_usecase.dart';
import '../../../../core/error/failures.dart';


class LoginController extends GetxController {
  // --- Dependencies ---
  final LoginUseCase _loginUseCase = Get.find();
  final AuthService _authService = Get.find();

  // --- State Management ---
  // استخدام Rx<UserStatus> من AuthService مباشرة لإدارة حالة التحميل
  // هذا يضمن أن الحالة متزامنة في كل التطبيق
  Rx<UserStatus> get authStatus => _authService.userStatus;

  final obscurePassword = true.obs;
  final isPhoneLogin = true.obs;

  // --- Form Management ---
  late GlobalKey<FormState> formKey;
  late TextEditingController emailController;
  late TextEditingController passwordController;
  late TextEditingController phoneController;

  // --- Phone Input Specific State ---
  final countryISOCode = 'YE'.obs;

  // ================== Lifecycle Methods ==================
  @override
  void onInit() {
    super.onInit();
    formKey = GlobalKey<FormState>();
    emailController = TextEditingController();
    passwordController = TextEditingController();
    phoneController = TextEditingController();
  }

  @override
  void onClose() {
    // TextEditingControllers are managed by Flutter widgets and GetX. 
    // Manual disposal here often causes "Used after disposed" errors during navigation animations.
    super.onClose();
  }

  // ================== UI Logic Methods ==================

  void toggleLoginType(bool isPhone) {
    if (authStatus.value == UserStatus.loading) return;
    isPhoneLogin.value = isPhone;
  }

  void togglePasswordVisibility() {
    obscurePassword.value = !obscurePassword.value;
  }

  // ================== Validation Methods ==================

  String? validateEmail(String? value) {
    if (value == null || value.isEmpty) return '16'.tr;
    if (!GetUtils.isEmail(value)) return '17'.tr;
    return null;
  }

  String? validatePassword(String? value) {
    if (value == null || value.isEmpty) return '18'.tr;
    /*if (value.length < 6) return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';*/
    return null;
  }

  String? validatePhone(String? value) {
    if (value == null || value.isEmpty) return '19'.tr;
    if (countryISOCode.value == 'YE') {
      if (!RegExp(r'^(71|73|77|78)\d{7}$').hasMatch(value)) {
        return 'رقم يمني غير صالح (9 أرقام)';
      }
    } else if (countryISOCode.value == 'SA') {
      if (!RegExp(r'^5\d{8}$').hasMatch(value)) {
        return 'رقم سعودي غير صالح (9 أرقام)';
      }
    }
    return null;
  }

  // ================== Core Logic & Navigation ==================


  Future<void> login() async {
    if (!await checkInternet()) {
      Get.snackbar('تنبيه', 'لا يوجد اتصال بالإنترنت');
      return;
    }

    if (!formKey.currentState!.validate()) return;
    if (authStatus.value == UserStatus.loading) return;
    final String identifier = isPhoneLogin.value
        ? phoneController.text.trim()
        : emailController.text.trim();

    final pwd = passwordController.text;

    final result = await _loginUseCase(LoginParams(
      email: identifier,
      password: pwd,
    ));

    result.fold(
      (failure) {
        _authService.userStatus.value = UserStatus.guest;
        Get.snackbar(
          '20'.tr,
          failure.message,
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.red.withOpacity(0.9),
          colorText: Colors.white,
        );
      },
      (user) {
        _authService.userStatus.value = UserStatus.authenticated;
        
        if (user.userType == 'driver') {
          Get.offAllNamed(AppRoute.DriverDashboard);
        } else {
          Get.offAllNamed(AppRoute.MainController);
        }

        Get.snackbar(
          'أهلاً',
          'مرحباً بك يا ${user.fullName}!',
          snackPosition: SnackPosition.TOP,
          backgroundColor: Colors.green.withOpacity(0.9),
          colorText: Colors.white,
        );
      },
    );
  }


  void goToSignUp() {
    Get.toNamed(AppRoute.SingUp);
  }

  void goToForgotPassword() {
    Get.toNamed(AppRoute.ForgetPassword);
  }
}
