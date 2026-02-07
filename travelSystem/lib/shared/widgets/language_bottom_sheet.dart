// file: view/widget/language_bottom_sheet.dart

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:travelsystem/core/constants/Color.dart';

import '../../core/constants/nameRoute.dart';
import '../../core/localization/Changelocal.dart';
// 1. استيراد الـ Controller الجديد

// دالة مساعدة لفتح الـ BottomSheet بسهولة من أي مكان
void showLanguageBottomSheet() {
  Get.bottomSheet(
    const LanguageBottomSheet(),
    // إعدادات إضافية لتحسين المظهر
    backgroundColor: Colors.transparent,
    isScrollControlled: true,
  );
}

class LanguageBottomSheet extends StatelessWidget {
  const LanguageBottomSheet({super.key});

  @override
  Widget build(BuildContext context) {
    // 2. الوصول إلى الـ Controller المسجل بالفعل باستخدام Get.find()
    final LocaleController controller = Get.find();

    final List<Map<String, dynamic>> langs = [
      {'name': 'العربية', 'code': 'ar', 'flag': '🇸🇦'},
      {'name': 'English', 'code': 'en', 'flag': '🇺🇸'},
    ];

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // --- المقبض العلوي ---
          Container(
            height: 4,
            width: 40,
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          // --- العنوان ---
          Text(
            '112'.tr,
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, fontFamily: 'Cairo'),
          ),
          const SizedBox(height: 8),
          const Divider(height: 1),

          // --- قائمة اللغات ---
          // استخدام Obx لإعادة بناء هذا الجزء فقط عند تغيير اللغة
          Obx(() => Column(
            mainAxisSize: MainAxisSize.min,
            children: langs.map((lang) {
              return ListTile(
                leading: Text(lang['flag'], style: const TextStyle(fontSize: 30)),
                title: Text(
                  lang['name'],
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w500, fontFamily: 'Cairo'),
                ),
                trailing: Radio<String>(
                  activeColor: AppColor.color_primary,
                  value: lang['code'],
                  // 3. استخدام الـ getter من الـ Controller للوصول إلى اللغة الحالية
                  groupValue: controller.currentLangCode,
                  onChanged: (value) {
                    if (value != null) {
                      // 4. استدعاء دالة تغيير اللغة وإغلاق الـ BottomSheet بعد ذلك
                      controller.changeLang(value).then((_) => Get.back());
                    }
                  },
                ),
                onTap: () {
                  controller.changeLang(lang['code']).then((_) =>  Get.back());
                },
              );
            }).toList(),
          )),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}
