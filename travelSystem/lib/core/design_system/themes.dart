// =============================================
// THEME EXTENSIONS
// Extending Flutter ThemeData with Design System
// =============================================

import 'package:flutter/material.dart';
import 'design_tokens.dart';

/// =============================================
/// CUSTOM COLOR SCHEME EXTENSION
/// =============================================

extension AppColorScheme on ColorScheme {
  // Extended semantic colors
  Color get success => AppColors.success;
  Color get warning => AppColors.warning;
  Color get error => AppColors.error;
  Color get info => AppColors.info;
  
  // Text colors
  Color get textPrimary => AppColors.textPrimary;
  Color get textSecondary => AppColors.textSecondary;
  Color get textTertiary => AppColors.textTertiary;
  Color get textDisabled => AppColors.textDisabled;
  
  // Background colors
  Color get backgroundSecondary => AppColors.backgroundSecondary;
  Color get backgroundElevated => AppColors.backgroundElevated;
  Color get surfaceVariant => AppColors.surfaceVariant;
  
  // Border colors
  Color get border => AppColors.border;
  Color get borderStrong => AppColors.borderStrong;
  Color get borderFocus => AppColors.borderFocus;
}

/// =============================================
/// CUSTOM TEXT THEME EXTENSION
/// =============================================

extension AppTextTheme on TextTheme {
  // Display styles
  TextStyle get displayLarge => AppTypography.displayLarge;
  TextStyle get displayMedium => AppTypography.displayMedium;
  TextStyle get displaySmall => AppTypography.displaySmall;
  
  // Headline styles
  TextStyle get headlineLarge => AppTypography.headlineLarge;
  TextStyle get headlineMedium => AppTypography.headlineMedium;
  TextStyle get headlineSmall => AppTypography.headlineSmall;
  
  // Title styles
  TextStyle get titleLarge => AppTypography.titleLarge;
  TextStyle get titleMedium => AppTypography.titleMedium;
  TextStyle get titleSmall => AppTypography.titleSmall;
  
  // Body styles
  TextStyle get bodyLarge => AppTypography.bodyLarge;
  TextStyle get bodyMedium => AppTypography.bodyMedium;
  TextStyle get bodySmall => AppTypography.bodySmall;
  
  // Label styles
  TextStyle get labelLarge => AppTypography.labelLarge;
  TextStyle get labelMedium => AppTypography.labelMedium;
  TextStyle get labelSmall => AppTypography.labelSmall;
}

/// =============================================
/// APP THEME DATA
/// =============================================

class AppThemes {
  // Light Theme
  static final ThemeData light = ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    primaryColor: AppColors.primary,
    scaffoldBackgroundColor: AppColors.background,
    
    // Color Scheme
    colorScheme: ColorScheme.light(
      primary: AppColors.primary,
      onPrimary: AppColors.textOnPrimary,
      secondary: AppColors.secondary,
      onSecondary: AppColors.textOnSecondary,
      surface: AppColors.surface,
      onSurface: AppColors.textPrimary,
      background: AppColors.background,
      onBackground: AppColors.textPrimary,
      error: AppColors.error,
      onError: AppColors.textOnPrimary,
      outline: AppColors.border,
    ),
    
    // App Bar Theme
    appBarTheme: AppBarTheme(
      backgroundColor: AppColors.backgroundSecondary,
      foregroundColor: AppColors.textPrimary,
      elevation: 0,
      centerTitle: true,
      titleTextStyle: AppTypography.headlineSmall,
      iconTheme: IconThemeData(color: AppColors.textPrimary),
    ),
    
    // Card Theme
    cardTheme: CardTheme(
      color: AppColors.surface,
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppRadius.lg),
      ),
      shadowColor: AppColors.overlay,
    ),
    
    // Text Theme
    textTheme: TextTheme(
      displayLarge: AppTypography.displayLarge,
      displayMedium: AppTypography.displayMedium,
      displaySmall: AppTypography.displaySmall,
      headlineLarge: AppTypography.headlineLarge,
      headlineMedium: AppTypography.headlineMedium,
      headlineSmall: AppTypography.headlineSmall,
      titleLarge: AppTypography.titleLarge,
      titleMedium: AppTypography.titleMedium,
      titleSmall: AppTypography.titleSmall,
      bodyLarge: AppTypography.bodyLarge,
      bodyMedium: AppTypography.bodyMedium,
      bodySmall: AppTypography.bodySmall,
      labelLarge: AppTypography.labelLarge,
      labelMedium: AppTypography.labelMedium,
      labelSmall: AppTypography.labelSmall,
    ),
    
    // Input Decoration Theme
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColors.gray50,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
        borderSide: BorderSide(color: AppColors.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
        borderSide: BorderSide(color: AppColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
        borderSide: BorderSide(color: AppColors.borderFocus, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
        borderSide: BorderSide(color: AppColors.error),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
        borderSide: BorderSide(color: AppColors.error, width: 2),
      ),
      labelStyle: AppTypography.labelMedium.copyWith(color: AppColors.textSecondary),
      hintStyle: AppTypography.bodyMedium.copyWith(color: AppColors.textTertiary),
    ),
    
    // Button Theme
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.textOnPrimary,
        textStyle: AppTypography.labelLarge,
        padding: EdgeInsets.symmetric(
          horizontal: AppSpacing.buttonPaddingHorizontal,
          vertical: AppSpacing.buttonPaddingVertical,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
        ),
      ),
    ),
    
    // Icon Theme
    iconTheme: IconThemeData(
      color: AppColors.textPrimary,
      size: 24,
    ),
    
    // Divider Theme
    dividerTheme: DividerThemeData(
      color: AppColors.border,
      thickness: 1,
      space: 1,
    ),
  );

  // Dark Theme
  static final ThemeData dark = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    primaryColor: AppColors.primary,
    scaffoldBackgroundColor: AppColors.gray900,
    
    // Color Scheme
    colorScheme: ColorScheme.dark(
      primary: AppColors.primary,
      onPrimary: AppColors.textOnPrimary,
      secondary: AppColors.secondary,
      onSecondary: AppColors.textOnSecondary,
      surface: AppColors.gray800,
      onSurface: AppColors.white,
      background: AppColors.gray900,
      onBackground: AppColors.white,
      error: AppColors.error,
      onError: AppColors.textOnPrimary,
      outline: AppColors.gray700,
    ),
    
    // App Bar Theme
    appBarTheme: AppBarTheme(
      backgroundColor: AppColors.gray900,
      foregroundColor: AppColors.white,
      elevation: 0,
      centerTitle: true,
      titleTextStyle: AppTypography.headlineSmall.copyWith(color: AppColors.white),
      iconTheme: IconThemeData(color: AppColors.white),
    ),
    
    // Card Theme
    cardTheme: CardTheme(
      color: AppColors.gray800,
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppRadius.lg),
      ),
      shadowColor: Colors.black.withOpacity(0.3),
    ),
    
    // Text Theme
    textTheme: TextTheme(
      displayLarge: AppTypography.displayLarge.copyWith(color: AppColors.white),
      displayMedium: AppTypography.displayMedium.copyWith(color: AppColors.white),
      displaySmall: AppTypography.displaySmall.copyWith(color: AppColors.white),
      headlineLarge: AppTypography.headlineLarge.copyWith(color: AppColors.white),
      headlineMedium: AppTypography.headlineMedium.copyWith(color: AppColors.white),
      headlineSmall: AppTypography.headlineSmall.copyWith(color: AppColors.white),
      titleLarge: AppTypography.titleLarge.copyWith(color: AppColors.white),
      titleMedium: AppTypography.titleMedium.copyWith(color: AppColors.white),
      titleSmall: AppTypography.titleSmall.copyWith(color: AppColors.white),
      bodyLarge: AppTypography.bodyLarge.copyWith(color: AppColors.white),
      bodyMedium: AppTypography.bodyMedium.copyWith(color: AppColors.gray300),
      bodySmall: AppTypography.bodySmall.copyWith(color: AppColors.gray400),
      labelLarge: AppTypography.labelLarge.copyWith(color: AppColors.white),
      labelMedium: AppTypography.labelMedium.copyWith(color: AppColors.gray300),
      labelSmall: AppTypography.labelSmall.copyWith(color: AppColors.gray400),
    ),
    
    // Input Decoration Theme
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColors.gray800,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
        borderSide: BorderSide(color: AppColors.gray700),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
        borderSide: BorderSide(color: AppColors.gray700),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
        borderSide: BorderSide(color: AppColors.borderFocus, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
        borderSide: BorderSide(color: AppColors.error),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
        borderSide: BorderSide(color: AppColors.error, width: 2),
      ),
      labelStyle: AppTypography.labelMedium.copyWith(color: AppColors.gray300),
      hintStyle: AppTypography.bodyMedium.copyWith(color: AppColors.gray500),
    ),
    
    // Button Theme
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.textOnPrimary,
        textStyle: AppTypography.labelLarge,
        padding: EdgeInsets.symmetric(
          horizontal: AppSpacing.buttonPaddingHorizontal,
          vertical: AppSpacing.buttonPaddingVertical,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
        ),
      ),
    ),
    
    // Icon Theme
    iconTheme: IconThemeData(
      color: AppColors.white,
      size: 24,
    ),
    
    // Divider Theme
    dividerTheme: DividerThemeData(
      color: AppColors.gray700,
      thickness: 1,
      space: 1,
    ),
  );
}

/// =============================================
/// UTILITY EXTENSIONS
/// =============================================

extension ColorExtensions on Color {
  /// Get color with opacity
  Color withOpacity(double opacity) {
    return this.withOpacity(opacity);
  }
  
  /// Get lighter version of color
  Color lighten([double amount = 0.1]) {
    assert(amount >= 0 && amount <= 1);
    final hsl = HSLColor.fromColor(this);
    return hsl.withLightness((hsl.lightness + amount).clamp(0.0, 1.0)).toColor();
  }
  
  /// Get darker version of color
  Color darken([double amount = 0.1]) {
    assert(amount >= 0 && amount <= 1);
    final hsl = HSLColor.fromColor(this);
    return hsl.withLightness((hsl.lightness - amount).clamp(0.0, 1.0)).toColor();
  }
}

extension SpacingExtensions on num {
  /// Convert number to spacing value based on design system
  double get sp => this * AppSpacing.unit;
  
  /// Horizontal padding
  EdgeInsets get ph => EdgeInsets.symmetric(horizontal: this.sp);
  
  /// Vertical padding
  EdgeInsets get pv => EdgeInsets.symmetric(vertical: this.sp);
  
  /// All sides padding
  EdgeInsets get pa => EdgeInsets.all(this.sp);
  
  /// Symmetric padding
  EdgeInsets get ps => EdgeInsets.symmetric(horizontal: this.sp, vertical: this.sp);
}

extension RadiusExtensions on num {
  /// Convert number to radius value
  BorderRadius get br => BorderRadius.circular(this.toDouble());
  
  /// Circular border radius
  BorderRadius get circular => BorderRadius.circular(50);
}