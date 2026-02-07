// file: lib/middleware/route_middleware.dart

import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../features/auth/controller/AuthService.dart';
import '../constants/nameRoute.dart';


class RouteMiddleware extends GetMiddleware {
  @override
  int? get priority => 0;

  final AuthService authService = Get.find();

  @override
  RouteSettings? redirect(String? route) {
    final bool seenOnboarding = authService.hasSeenOnboarding();
    final bool isLoggedIn = authService.isAuthenticated;

    print("Middleware: Checking route '$route'. Seen Onboarding: $seenOnboarding, Is Logged In: $isLoggedIn");

    // --- القاعدة رقم 1: التعامل مع Onboarding ---
    // إذا لم ير المستخدم Onboarding، يجب أن يذهب إليها أولاً وقبل كل شيء.
    if (!seenOnboarding) {
      // اسمح له بالوصول فقط إذا كان المسار هو Onboarding نفسه.
      // إذا حاول الذهاب لأي مكان آخر، أعد توجيهه إلى Onboarding.
      return route == AppRoute.onBording
          ? null // المسار صحيح، لا تفعل شيئًا
          : RouteSettings(name: AppRoute.onBording); // المسار خاطئ، أجبِره على Onboarding
    }

    // --- من هذه النقطة فصاعدًا، نحن متأكدون 100% أن المستخدم قد رأى Onboarding ---

    // --- القاعدة رقم 2: التعامل مع المستخدم المسجل ---
    if (isLoggedIn) {
      final String? userType = authService.userType;
      
      // إذا كان المستخدم مسجلاً ويحاول الذهاب إلى صفحات المصادقة (Login/Onboarding)،
      // فهذا خطأ. أعد توجيهه إلى الصفحة الرئيسية المناسبة لدوره.
      if (route == AppRoute.Login || route == AppRoute.onBording) {
        if (userType == 'driver') {
          return RouteSettings(name: AppRoute.DriverDashboard);
        }
        return RouteSettings(name: AppRoute.MainController);
      }
      
      // منع وصول السائق لصفحات العميل والعكس (اختياري لكن احترافي)
      /* 
      // تم تعطيل هذا القيد للسماح للسائق بالتبديل لوضع العميل
      if (userType == 'driver' && route == AppRoute.MainController) {
        return RouteSettings(name: AppRoute.DriverDashboard);
      }
      */
      
      if (userType == 'customer' && route == AppRoute.DriverDashboard) {
        return RouteSettings(name: AppRoute.MainController);
      }
    }
    // --- القاعدة رقم 3: التعامل مع الضيف (الذي رأى Onboarding) ---
    else { // (isLoggedIn is false)
      // إذا كان المستخدم ضيفًا ويحاول الذهاب إلى أي صفحة غير صفحة تسجيل الدخول،
      // فهذا خطأ. أعد توجيهه إلى صفحة تسجيل الدخول.
      // هذا يضمن أن الضيف لا يمكنه الوصول إلى الصفحة الرئيسية أو أي صفحات داخلية أخرى.
      if (route != AppRoute.Login) {
        return RouteSettings(name: AppRoute.Login);
      }
    }

    // إذا وصل الكود إلى هنا، فهذا يعني أن المستخدم في المسار الصحيح
    // (مثال: مستخدم مسجل يذهب إلى الرئيسية، أو ضيف يذهب إلى صفحة الدخول).
    // `return null` يعني "اسمح بالمرور".
    return null;
  }
}
