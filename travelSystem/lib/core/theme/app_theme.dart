import 'package:flutter/material.dart';
import '../constants/Color.dart';

class AppTheme {
  AppTheme._();

  // Modern Light Theme
  static final ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    primaryColor: AppColor.primary,
    scaffoldBackgroundColor: Colors.white, // Soft cool white
    colorScheme: ColorScheme.light(
      primary: AppColor.primary,
      onPrimary: Colors.white,
      secondary: AppColor.accent,
      onSecondary: const Color(0xFF4A4A4A),
      surface: Colors.white,
      onSurface: const Color(0xFF1A1C1E),
      error: AppColor.error,
      onError: Colors.white,
      outline: const Color(0xFFE0E2EC),
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: Color(0xFFF8F9FD),
      foregroundColor: Color(0xFF1A1C1E),
      elevation: 0,
      centerTitle: true,
      iconTheme: IconThemeData(color: Color(0xFF1A1C1E)),
    ),
    cardTheme: CardTheme(
      color: Colors.white,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: const BorderSide(color: Color(0xFFF0F2F8), width: 1),
      ),
    ),
    textTheme: const TextTheme(
      displayLarge: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Color(0xFF1A1C1E), fontFamily: 'Cairo'),
      titleLarge: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF1A1C1E), fontFamily: 'Cairo'),
      bodyLarge: TextStyle(fontSize: 16, color: Color(0xFF1A1C1E), fontFamily: 'Cairo'),
      bodyMedium: TextStyle(fontSize: 14, color: Color(0xFF44474E), fontFamily: 'Cairo'),
    ),
  );

  // Premium Dark Theme (Modern Luxury)
  static final ThemeData darkTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    primaryColor: AppColor.primary,
    scaffoldBackgroundColor: const Color(0xFF0F172A), // Midnight Blue
    colorScheme: ColorScheme.dark(
      primary: AppColor.primary,
      onPrimary: Colors.white,
      secondary: AppColor.accent,
      onSecondary: Colors.black,
      surface: const Color(0xFF1E293B), // Slate / Deep Indigo
      onSurface: const Color(0xFFF1F5F9),
      error: const Color(0xFFFFB4AB),
      onError: const Color(0xFF690005),
      outline: const Color(0xFF334155),
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: Color(0xFF0F172A),
      foregroundColor: Color(0xFFF1F5F9),
      elevation: 0,
      centerTitle: true,
      iconTheme: IconThemeData(color: Color(0xFFF1F5F9)),
    ),
    cardTheme: CardTheme(
      color: const Color(0xFF1E293B),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: const BorderSide(color: Color(0xFF334155), width: 1),
      ),
    ),
    textTheme: const TextTheme(
      displayLarge: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Color(0xFFF1F5F9), fontFamily: 'Cairo'),
      titleLarge: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFFF1F5F9), fontFamily: 'Cairo'),
      bodyLarge: TextStyle(fontSize: 16, color: Color(0xFFF1F5F9), fontFamily: 'Cairo'),
      bodyMedium: TextStyle(fontSize: 14, color: Color(0xFF94A3B8), fontFamily: 'Cairo'),
    ),
  );
}
