// file: controller/locale_controller.dart (تم تعديل الاسم ليكون قياسيًا)

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';


class LocaleController extends GetxController {

  final _storage = GetStorage();

  final Rx<Locale> appLocale = Get.deviceLocale!.obs;

  final String _langKey = 'app_language';

  String get currentLangCode => appLocale.value.languageCode;

  // ================== Lifecycle Methods ==================

  @override
  void onInit() {
    super.onInit();
    _loadSavedLocale(); // تحميل اللغة المحفوظة عند بدء تشغيل التطبيق
  }

  /// دالة خاصة لتحميل اللغة المحفوظة وتطبيقها
  void _loadSavedLocale() {
    // 1. اقرأ رمز اللغة المحفوظ من الذاكرة
    final String? savedLangCode = _storage.read<String>(_langKey);

    if (savedLangCode != null && savedLangCode.isNotEmpty) {
      // 2. إذا كانت هناك لغة محفوظة، قم بتطبيقها على التطبيق
      print("LocaleController: Found saved language: $savedLangCode");
      changeLang(savedLangCode);
    } else {
      // 3. إذا لم تكن هناك لغة محفوظة، استخدم لغة الجهاز
      print("LocaleController: No saved language, using device locale: ${Get.deviceLocale?.languageCode}");
      appLocale.value = Get.deviceLocale ?? const Locale('ar'); // 'ar' كلغة افتراضية
    }
    update();
  }

  // ================== Core Logic ==================

  /// دالة لتغيير لغة التطبيق وحفظ الاختيار
  Future<void> changeLang(String langCode) {
    // 1. التحقق من أن اللغة الجديدة مختلفة عن الحالية لتجنب العمل غير الضروري
    if (currentLangCode == langCode) {
      print("LocaleController: Language is already set to $langCode.");
      return Future.value(); // إنهاء الدالة
    }

    // 2. إنشاء كائن Locale جديد
    final Locale newLocale = Locale(langCode);

    // 3. حفظ رمز اللغة الجديد في الذاكرة المحلية
    _storage.write(_langKey, langCode);

    // 4. تحديث لغة التطبيق باستخدام GetX
    Get.updateLocale(newLocale);

    // 5. تحديث المتغير التفاعلي لإعلام الواجهات الأخرى بالتغيير
    appLocale.value = newLocale;

    print("LocaleController: Language changed to $langCode.");
    update();
    return Future.value();

  }

}
