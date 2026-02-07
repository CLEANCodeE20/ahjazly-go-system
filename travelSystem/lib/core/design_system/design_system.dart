// =============================================
// TRAVEL SYSTEM DESIGN SYSTEM
// Unified Design System Entry Point
// =============================================

export 'design_tokens.dart';
export 'components.dart';
export 'themes.dart';
export 'showcase.dart';

// =============================================
// USAGE GUIDE
// =============================================

/*
=============================================
TRAVEL SYSTEM DESIGN SYSTEM - USAGE GUIDE
=============================================

1. COLORS
---------
Use AppColors for consistent coloring:
- AppColors.primary (main brand color)
- AppColors.success, AppColors.warning, AppColors.error (semantic colors)
- AppColors.textPrimary, AppColors.textSecondary (text colors)
- AppColors.background, AppColors.surface (background colors)

Example:
Container(
  color: AppColors.primary,
  child: Text('Hello', style: TextStyle(color: AppColors.textOnPrimary)),
)

2. TYPOGRAPHY
-------------
Use AppTypography for consistent text styling:
- AppTypography.headlineLarge, AppTypography.headlineMedium, AppTypography.headlineSmall
- AppTypography.titleLarge, AppTypography.titleMedium, AppTypography.titleSmall
- AppTypography.bodyLarge, AppTypography.bodyMedium, AppTypography.bodySmall

Example:
Text('Heading', style: AppTypography.headlineMedium)

3. SPACING
----------
Use AppSpacing for consistent spacing:
- AppSpacing.xs, AppSpacing.sm, AppSpacing.md, AppSpacing.lg, AppSpacing.xl
- Or use extension: 2.sp (equals 16px based on 8px grid)

Example:
Padding(padding: EdgeInsets.all(AppSpacing.md))
// or
Padding(padding: 2.ps) // 2 * 8px = 16px

4. COMPONENTS
-------------
Use design system components:
- AppButton (primary, secondary, tertiary, outlined variants)
- AppCard (with consistent shadows and borders)
- AppInputField (with proper validation states)
- AppBadge (semantic badge variants)
- AppDivider (consistent dividers)

Example:
AppButton(
  text: 'Click Me',
  variant: ButtonVariant.primary,
  size: ButtonSize.medium,
  onPressed: () => print('Clicked!'),
)

5. THEMING
----------
The design system automatically adapts to light/dark themes.
Use Theme.of(context) to access theme-aware colors and styles.

Example:
final theme = Theme.of(context);
Container(
  color: theme.colorScheme.primary,
  child: Text('Themed Text', style: theme.textTheme.titleLarge),
)

6. BEST PRACTICES
----------------
✓ Always use design system tokens instead of hardcoded values
✓ Maintain consistent spacing using the 8px grid system
✓ Use semantic colors for status and actions
✓ Leverage component library for consistent UI patterns
✓ Test both light and dark theme variations
✓ Use proper typography hierarchy

7. CUSTOMIZATION
---------------
To customize the design system:
- Modify values in design_tokens.dart
- Update themes in themes.dart
- Extend components in components.dart
- All changes will propagate throughout the app

=============================================
*/