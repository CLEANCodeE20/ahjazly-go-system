import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:travelsystem/core/constants/nameRoute.dart';
import 'package:travelsystem/core/constants/api_endpoints.dart';
import 'package:travelsystem/core/services/api_service.dart' hide AuthException;
import '../../supabase_integration/supabase_auth_service.dart';
import '../../../../core/services/email_service.dart';
import 'AuthService.dart';
import '../domain/usecases/signup_usecase.dart';
import '../../../../core/error/failures.dart';

enum Gender { male, female, none }

class RegisterController extends GetxController {
  // --- المدخلات
  final fullNameController = TextEditingController();
  final emailController = TextEditingController();
  final passwordController = TextEditingController();
  final confirmPasswordController = TextEditingController();
  final phoneNumber = ''.obs;

  // --- الحالة
  final SignUpUseCase _signUpUseCase = Get.find();
  final AuthService _authService = Get.find<AuthService>();
  Rx<UserStatus> get authStatus => _authService.userStatus;

  final countryISOCode = 'YE'.obs;
  final gender = Gender.none.obs;
  final obscurePassword = true.obs;
  final obscureConfirmPassword = true.obs;
  final errorMessage = ''.obs;
  late GlobalKey<FormState> formKey;

  // --- التحقق من صحة المدخلات ---
  bool validateForm() {
    errorMessage.value = '';
    if (fullNameController.text.trim().isEmpty) {
      errorMessage.value = 'يرجى إدخال الاسم الكامل';
      return false;
    }
    if (phoneNumber.value.trim().isEmpty) {
      errorMessage.value = 'يرجى إدخال رقم الهاتف';
      return false;
    }
    // تحقق من صحة الرقم حسب الدولة:
    if (!validatePhone(phoneNumber.value)) return false;

    if (emailController.text.trim().isEmpty) {
      errorMessage.value = 'يرجى إدخال البريد الإلكتروني';
      return false;
    }
    if (!GetUtils.isEmail(emailController.text.trim())) {
      errorMessage.value = 'البريد الإلكتروني غير صحيح';
      return false;
    }
    if (passwordController.text.length < 6) {
      errorMessage.value = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
      return false;
    }
    if (passwordController.text != confirmPasswordController.text) {
      errorMessage.value = 'كلمة المرور غير متطابقة';
      return false;
    }
    if (gender.value == Gender.none) {
      errorMessage.value = 'يرجى اختيار الجنس';
      return false;
    }
    return true;
  }

  bool validatePhone(String number) {
    if (countryISOCode.value == 'YE' &&
        !(number.startsWith('71') ||
            number.startsWith('73') ||
            number.startsWith('77') ||
            number.startsWith('78'))) {
      errorMessage.value = 'رقم اليمن يجب أن يبدأ بـ: 71، 73، 77 أو 78';
      return false;
    }
    if (countryISOCode.value == 'SA' && !number.startsWith('50')) {
      errorMessage.value = 'رقم السعودية يجب أن يبدأ بـ: 50';
      return false;
    }
    return true;
  }


  Future<void> register() async {
    print(errorMessage);
    if (!validateForm()) return;

    String genderValue = gender.value == Gender.male
        ? "M"
        : gender.value == Gender.female
        ? "F"
        : "";

    errorMessage.value = '';
    
    errorMessage.value = '';
    
    try {
      // Use the UseCase for Clean Architecture
      final result = await _signUpUseCase(SignUpParams(
        email: emailController.text.trim(),
        password: passwordController.text,
        data: {
          "full_name": fullNameController.text.trim(),
          "phone_number": phoneNumber.value,
          "user_type": "customer",
          "gender": gender.value == Gender.male ? "M" : "F",
        },
      ));

      result.fold(
        (failure) => _handleRegistrationError(failure),
        (user) async {
          // --- Custom Verification Flow (Secure Server-Side) ---
          final emailService = Get.put(EmailService());
          await emailService.sendVerificationCode(
            emailController.text.trim(), 
            fullNameController.text.trim()
          );

          Get.snackbar(
            'نجاح',
            'تم إنشاء الحساب. تم إرسال كود التحقق إلى بريدك الإلكتروني',
            snackPosition: SnackPosition.BOTTOM,
            backgroundColor: Colors.green.withOpacity(0.9),
            colorText: Colors.white,
          );

          Get.toNamed(
              AppRoute.VerificationCodesginup, 
              arguments: {
                'email': emailController.text.trim(),
                'password': passwordController.text,
              }
          );
        },
      );
    } catch (e) {
      _handleRegistrationError(ServerFailure(e.toString()));
    }
  }

  void _handleRegistrationError(Failure failure) {
    String title = 'خطأ'.tr;
    String message = failure.message;

    if (message.contains('already registered') || message.contains('user_already_exists')) {
      _showUserExistsDialog();
      return;
    }

    errorMessage.value = message;
    Get.snackbar(
      title,
      message,
      snackPosition: SnackPosition.BOTTOM,
      backgroundColor: Colors.red.withOpacity(0.9),
      colorText: Colors.white,
      margin: const EdgeInsets.all(15),
      borderRadius: 15,
      duration: const Duration(seconds: 4),
    );
  }

  void _showUserExistsDialog() {
    Get.dialog(
      Center(
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 30),
          padding: const EdgeInsets.all(25),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(25),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 20,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Material(
            color: Colors.transparent,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.orange.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.person_search_rounded,
                    color: Colors.orangeAccent,
                    size: 40,
                  ),
                ).animate().scale(duration: 400.ms, curve: Curves.easeOutBack),
                const SizedBox(height: 20),
                Text(
                  "الحساب موجود بالفعل".tr,
                  style: const TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF2D3142),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  "يبدو أنك تملك حساباً مسجلاً بهذا البريد أو الرقم مسبقاً. هل تود تسجيل الدخول بدلاً من ذلك؟".tr,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 14,
                    color: Colors.grey.shade600,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 30),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          Get.back();
                          Get.offAllNamed(AppRoute.Login);
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF1A1A1A),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 15),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(15),
                          ),
                          elevation: 0,
                        ),
                        child: Text(
                          "تسجيل الدخول".tr,
                          style: const TextStyle(
                            fontFamily: 'Cairo',
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => Get.back(),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 15),
                          side: BorderSide(color: Colors.grey.shade300),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(15),
                          ),
                        ),
                        child: Text(
                          "إلغاء".tr,
                          style: TextStyle(
                            fontFamily: 'Cairo',
                            color: Colors.grey.shade700,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ).animate().fadeIn(duration: 300.ms).scale(begin: const Offset(0.9, 0.9)),
      ),
    );
  }

  void togglePasswordVisibility() =>
      obscurePassword.value = !obscurePassword.value;

  void toggleConfirmPasswordVisibility() =>
      obscureConfirmPassword.value = !obscureConfirmPassword.value;

  void goToLogin() {
    Get.offAllNamed(AppRoute.Login);
  }

  // إعادة تعيين النموذج بعد استخدامه
  void clearForm() {
    fullNameController.clear();
    emailController.clear();
    passwordController.clear();
    confirmPasswordController.clear();
    phoneNumber.value = '';
    gender.value = Gender.none;
    errorMessage.value = '';
  }

  @override
  void onInit() {
    formKey = GlobalKey<FormState>();
    super.onInit();
  }

  @override
  void onClose() {
    // TextEditingControllers are managed by Flutter widgets and GetX. 
    // Manual disposal here often causes "Used after disposed" errors during navigation animations.
    super.onClose();
  }
}
