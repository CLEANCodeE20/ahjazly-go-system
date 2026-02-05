// file: controller/onboarding_controller.dart

import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/constants/nameRoute.dart';
import '../../auth/controller/AuthService.dart';
import '../data/static/DataonBorading.dart';

// لا حاجة للكلاس المجرد، نبدأ مباشرة بالكلاس الفعلي
class OnboardingController extends GetxController {
  // --- Dependencies ---
  // حقن AuthService للوصول إلى GetStorage والتحكم في حالة Onboarding
  final AuthService _authService = Get.find();

  // --- State Management ---
  // استخدام متغير تفاعلي (.obs) لتتبع الصفحة الحالية.
  // الواجهة ستستمع إليه باستخدام Obx وستتحدث تلقائيًا.
  var currentPage = 0.obs;

  // --- Controllers ---
  late PageController pageController;

  // ================== Lifecycle Methods ==================

  @override
  void onInit() {
    super.onInit();
    pageController = PageController();
  }

  @override
  void onClose() {
    pageController.dispose();
    super.onClose();
  }

  // ================== UI Event Handlers ==================

  /// يتم استدعاؤها عند تغيير الصفحة في PageView
  void onPageChanged(int index) {
    currentPage.value = index;
  }

  /// الانتقال إلى الصفحة التالية أو إنهاء الـ Onboarding
  void next() {
    // التحقق مما إذا كنا في الصفحة الأخيرة
    if (isLastPage) {
      // إذا كنا في الصفحة الأخيرة، قم بإنهاء الـ Onboarding
      completeOnboarding();
    } else {
      // إذا لم نكن في الصفحة الأخيرة، انتقل إلى الصفحة التالية بحركة ناعمة
      pageController.nextPage(
        duration: const Duration(milliseconds: 500),
        curve: Curves.easeInOutCubic,
      );
    }
  }

  void skip() {
    completeOnboarding();
  }

  void completeOnboarding() {
    _authService.setOnboardingSeen();
    Get.offAllNamed(AppRoute.Login);
  }

  bool get isLastPage => currentPage.value == Data_onBorading.length - 1;
}
