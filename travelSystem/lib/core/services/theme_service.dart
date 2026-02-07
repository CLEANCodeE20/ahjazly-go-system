import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';

class ThemeService {
  final _box = GetStorage();
  final _key = 'isDarkMode';

  late RxBool isDarkMode;

  ThemeService() {
    isDarkMode = _loadThemeFromBox().obs;
  }

  /// الحصول على حالة الثيم الحالية من التخزين المحلي
  ThemeMode get theme => isDarkMode.value ? ThemeMode.dark : ThemeMode.light;

  /// قراءة القيمة من التخزين
  bool _loadThemeFromBox() => _box.read(_key) ?? false;

  /// حفظ حالة الثيم في التخزين المحلي
  _saveThemeToBox(bool value) => _box.write(_key, value);

  /// تبديل الثيم ديناميكياً
  void switchTheme() {
    isDarkMode.value = !isDarkMode.value;
    Get.changeThemeMode(isDarkMode.value ? ThemeMode.dark : ThemeMode.light);
    _saveThemeToBox(isDarkMode.value);
  }
}
