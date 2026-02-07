import 'package:flutter/material.dart';

/// Centralized color palette used across the app.
class AppColor {
  AppColor._();

  /// Brand colors
  static const Color primary = Color(0xFF9D71BD);
  static const Color primaryLight = Color(0xFFC69CF4);
  static const Color primaryLighter = Color(0xFFF4EAFF);

  /// Accent & semantic colors
  static const Color accent = Color(0xFFFFD934);
  static const Color success = Color(0xFF2ECC71);
  static const Color warning = Color(0xFFFFAA5B);
  static const Color error = Color(0xFFFF6B6B);

  /// Neutral colors
  static const Color background = Color(0xFFF8F7FA);
  static const Color surface = Colors.white;
  static const Color textPrimary = Color(0xFF1E1E1E);
  static const Color textSecondary = Color(0xFF6B6B6B);
  static const Color divider = Color(0xFFE8E5ED);

  /// Legacy aliases (for backward compatibility)
  static Color get color_primary => primary;
  static Color get color_primary2 => primaryLight;
  static Color get color_primary3 => primaryLighter;
  static Color get color_secondary => surface;
  static Color get color_accent => accent;
}

/// Gradient collection used in the UI.
class AppGradients {
  AppGradients._();

  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFFB68EE7), AppColor.primary],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static final LinearGradient subtleGradient = LinearGradient(
    colors: [AppColor.primary.withOpacity(0.12), Colors.transparent],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  static const LinearGradient accentGradient = LinearGradient(
    colors: [Color(0xFFFFD76F), Color(0xFFFFAE34)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}

/// Common text styles used across screens.
class AppTextStyles {
  AppTextStyles._();

  static const TextStyle headline = TextStyle(
    fontSize: 24,
    fontWeight: FontWeight.w700,
    color: AppColor.textPrimary,
  );

  static const TextStyle subtitle = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w500,
    color: AppColor.textSecondary,
  );

  static const TextStyle body = TextStyle(
    fontSize: 14,
    color: AppColor.textSecondary,
  );
}