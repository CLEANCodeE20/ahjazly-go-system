// =============================================
// TRAVEL SYSTEM DESIGN TOKENS
// Unified Design System for Consistent UI/UX
// =============================================

import 'package:flutter/material.dart';

/// =============================================
/// CORE COLOR PALETTE
/// =============================================

class AppColors {
  // Primary Brand Colors
  static const Color primary = Color(0xFF9D71BD);
  static const Color primaryLight = Color(0xFFC69CF4);
  static const Color primaryDark = Color(0xFF7A4A9E);
  static const Color primaryContrast = Colors.white;

  // Secondary/Accent Colors
  static const Color secondary = Color(0xFFFFD934);
  static const Color secondaryLight = Color(0xFFFFE572);
  static const Color secondaryDark = Color(0xFFFFC700);

  // Semantic Colors
  static const Color success = Color(0xFF10B981);
  static const Color successLight = Color(0xFF6EE7B7);
  static const Color successDark = Color(0xFF047857);
  
  static const Color warning = Color(0xFFF59E0B);
  static const Color warningLight = Color(0xFFFCD34D);
  static const Color warningDark = Color(0xFFB45309);
  
  static const Color error = Color(0xFFEF4444);
  static const Color errorLight = Color(0xFFFCA5A5);
  static const Color errorDark = Color(0xFFDC2626);
  
  static const Color info = Color(0xFF3B82F6);
  static const Color infoLight = Color(0xFF93C5FD);
  static const Color infoDark = Color(0xFF1D4ED8);

  // Neutral Colors (Light Theme)
  static const Color white = Colors.white;
  static const Color black = Colors.black;
  static const Color gray50 = Color(0xFFFAFAFA);
  static const Color gray100 = Color(0xFFF5F5F5);
  static const Color gray200 = Color(0xFFE5E5E5);
  static const Color gray300 = Color(0xFFD4D4D4);
  static const Color gray400 = Color(0xFFA3A3A3);
  static const Color gray500 = Color(0xFF737373);
  static const Color gray600 = Color(0xFF525252);
  static const Color gray700 = Color(0xFF404040);
  static const Color gray800 = Color(0xFF262626);
  static const Color gray900 = Color(0xFF171717);

  // Text Colors
  static const Color textPrimary = gray900;
  static const Color textSecondary = gray600;
  static const Color textTertiary = gray400;
  static const Color textDisabled = gray300;
  static const Color textOnPrimary = white;
  static const Color textOnSecondary = gray900;

  // Background Colors
  static const Color background = gray50;
  static const Color backgroundSecondary = white;
  static const Color backgroundElevated = white;
  static const Color surface = white;
  static const Color surfaceVariant = gray100;

  // Border Colors
  static const Color border = gray200;
  static const Color borderStrong = gray300;
  static const Color borderFocus = primary;
  static const Color borderError = error;

  // Overlay Colors
  static const Color overlay = Color(0x80000000); // 50% black
  static const Color scrim = Color(0x40000000); // 25% black
}

/// =============================================
/// TYPOGRAPHY SYSTEM
/// =============================================

class AppTypography {
  // Font Family
  static const String fontPrimary = 'Cairo';
  static const String fontSecondary = 'Roboto';

  // Display Headlines
  static const TextStyle displayLarge = TextStyle(
    fontFamily: fontPrimary,
    fontSize: 57,
    fontWeight: FontWeight.w700,
    height: 1.1,
    letterSpacing: -0.25,
  );

  static const TextStyle displayMedium = TextStyle(
    fontFamily: fontPrimary,
    fontSize: 45,
    fontWeight: FontWeight.w700,
    height: 1.1,
    letterSpacing: 0,
  );

  static const TextStyle displaySmall = TextStyle(
    fontFamily: fontPrimary,
    fontSize: 36,
    fontWeight: FontWeight.w700,
    height: 1.1,
    letterSpacing: 0,
  );

  // Headlines
  static const TextStyle headlineLarge = TextStyle(
    fontFamily: fontPrimary,
    fontSize: 32,
    fontWeight: FontWeight.w700,
    height: 1.2,
    letterSpacing: 0,
  );

  static const TextStyle headlineMedium = TextStyle(
    fontFamily: fontPrimary,
    fontSize: 28,
    fontWeight: FontWeight.w700,
    height: 1.2,
    letterSpacing: 0,
  );

  static const TextStyle headlineSmall = TextStyle(
    fontFamily: fontPrimary,
    fontSize: 24,
    fontWeight: FontWeight.w700,
    height: 1.2,
    letterSpacing: 0,
  );

  // Titles
  static const TextStyle titleLarge = TextStyle(
    fontFamily: fontPrimary,
    fontSize: 22,
    fontWeight: FontWeight.w600,
    height: 1.2,
    letterSpacing: 0,
  );

  static const TextStyle titleMedium = TextStyle(
    fontFamily: fontPrimary,
    fontSize: 16,
    fontWeight: FontWeight.w600,
    height: 1.3,
    letterSpacing: 0.15,
  );

  static const TextStyle titleSmall = TextStyle(
    fontFamily: fontPrimary,
    fontSize: 14,
    fontWeight: FontWeight.w600,
    height: 1.3,
    letterSpacing: 0.1,
  );

  // Body Text
  static const TextStyle bodyLarge = TextStyle(
    fontFamily: fontPrimary,
    fontSize: 16,
    fontWeight: FontWeight.w400,
    height: 1.4,
    letterSpacing: 0.5,
  );

  static const TextStyle bodyMedium = TextStyle(
    fontFamily: fontPrimary,
    fontSize: 14,
    fontWeight: FontWeight.w400,
    height: 1.4,
    letterSpacing: 0.25,
  );

  static const TextStyle bodySmall = TextStyle(
    fontFamily: fontPrimary,
    fontSize: 12,
    fontWeight: FontWeight.w400,
    height: 1.4,
    letterSpacing: 0.4,
  );

  // Labels
  static const TextStyle labelLarge = TextStyle(
    fontFamily: fontPrimary,
    fontSize: 14,
    fontWeight: FontWeight.w500,
    height: 1.3,
    letterSpacing: 0.1,
  );

  static const TextStyle labelMedium = TextStyle(
    fontFamily: fontPrimary,
    fontSize: 12,
    fontWeight: FontWeight.w500,
    height: 1.3,
    letterSpacing: 0.5,
  );

  static const TextStyle labelSmall = TextStyle(
    fontFamily: fontPrimary,
    fontSize: 11,
    fontWeight: FontWeight.w500,
    height: 1.3,
    letterSpacing: 0.5,
  );
}

/// =============================================
/// SPACING SYSTEM
/// =============================================

class AppSpacing {
  // Base Unit (8px grid system)
  static const double unit = 8.0;

  // Standard Spacing Scale
  static const double xxs = unit * 0.5;    // 4px
  static const double xs = unit;           // 8px
  static const double sm = unit * 1.5;     // 12px
  static const double md = unit * 2;       // 16px
  static const double lg = unit * 3;       // 24px
  static const double xl = unit * 4;       // 32px
  static const double xxl = unit * 5;      // 40px
  static const double xxxl = unit * 6;     // 48px

  // Component Specific Spacing
  static const double buttonPaddingHorizontal = md;
  static const double buttonPaddingVertical = sm;
  static const double cardPadding = lg;
  static const double inputPadding = md;
  static const double listItemPadding = md;
}

/// =============================================
/// BORDER RADIUS SYSTEM
/// =============================================

class AppRadius {
  static const double none = 0.0;
  static const double xs = 4.0;
  static const double sm = 8.0;
  static const double md = 12.0;
  static const double lg = 16.0;
  static const double xl = 20.0;
  static const double xxl = 24.0;
  static const double circular = 50.0;
  static const double full = 999.0; // For fully rounded corners
}

/// =============================================
/// SHADOW/ELEVATION SYSTEM
/// =============================================

class AppShadows {
  static final BoxShadow none = BoxShadow(color: Colors.transparent, blurRadius: 0);
  
  static final BoxShadow sm = BoxShadow(
    color: Colors.black.withOpacity(0.05),
    blurRadius: 4,
    offset: const Offset(0, 1),
  );
  
  static final BoxShadow md = BoxShadow(
    color: Colors.black.withOpacity(0.1),
    blurRadius: 8,
    offset: const Offset(0, 2),
  );
  
  static final BoxShadow lg = BoxShadow(
    color: Colors.black.withOpacity(0.15),
    blurRadius: 16,
    offset: const Offset(0, 4),
  );
  
  static final BoxShadow xl = BoxShadow(
    color: Colors.black.withOpacity(0.2),
    blurRadius: 24,
    offset: const Offset(0, 8),
  );

  // Elevation levels for Material Design
  static List<BoxShadow> elevation1 = [sm];
  static List<BoxShadow> elevation2 = [md];
  static List<BoxShadow> elevation3 = [lg];
  static List<BoxShadow> elevation4 = [xl];
}

/// =============================================
/// ANIMATION TIMING
/// =============================================

class AppTiming {
  static const Duration fast = Duration(milliseconds: 150);
  static const Duration medium = Duration(milliseconds: 300);
  static const Duration slow = Duration(milliseconds: 500);
  static const Duration slower = Duration(milliseconds: 700);
}

/// =============================================
/// BREAKPOINTS
/// =============================================

class AppBreakpoints {
  static const double mobile = 480;
  static const double tablet = 768;
  static const double desktop = 1024;
  static const double largeDesktop = 1440;
}

/// =============================================
/// GRADIENTS
/// =============================================

class AppGradients {
  static const LinearGradient primary = LinearGradient(
    colors: [AppColors.primary, AppColors.primaryDark],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient secondary = LinearGradient(
    colors: [AppColors.secondary, AppColors.secondaryDark],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient success = LinearGradient(
    colors: [AppColors.success, AppColors.successDark],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient error = LinearGradient(
    colors: [AppColors.error, AppColors.errorDark],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static final LinearGradient subtle = LinearGradient(
    colors: [AppColors.primary.withOpacity(0.1), Colors.transparent],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );
}