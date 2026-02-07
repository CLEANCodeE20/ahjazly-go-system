// =============================================
// COMPONENT LIBRARY
// Reusable UI Components Following Design System
// =============================================

import 'package:flutter/material.dart';
import 'design_tokens.dart';

/// =============================================
/// APP BUTTON COMPONENT
/// =============================================

class AppButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final ButtonStyle? style;
  final ButtonSize size;
  final ButtonVariant variant;
  final bool isLoading;
  final IconData? icon;
  final MainAxisAlignment iconAlignment;

  const AppButton({
    Key? key,
    required this.text,
    this.onPressed,
    this.style,
    this.size = ButtonSize.medium,
    this.variant = ButtonVariant.primary,
    this.isLoading = false,
    this.icon,
    this.iconAlignment = MainAxisAlignment.center,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    
    final buttonStyle = style ?? _getDefaultStyle(theme, isDark);
    final padding = _getPadding();
    final textStyle = _getTextStyle();

    return ElevatedButton(
      onPressed: isLoading ? null : onPressed,
      style: buttonStyle?.copyWith(
        padding: MaterialStateProperty.all(padding),
      ),
      child: isLoading
          ? SizedBox(
              width: _getLoadingSize(),
              height: _getLoadingSize(),
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation<Color>(
                  variant == ButtonVariant.primary 
                    ? AppColors.textOnPrimary 
                    : theme.colorScheme.primary,
                ),
              ),
            )
          : Row(
              mainAxisAlignment: iconAlignment,
              children: [
                if (icon != null) ...[
                  Icon(icon, size: _getIconSize()),
                  SizedBox(width: AppSpacing.xs),
                ],
                Text(text, style: textStyle),
              ],
            ),
    );
  }

  ButtonStyle? _getDefaultStyle(ThemeData theme, bool isDark) {
    switch (variant) {
      case ButtonVariant.primary:
        return ElevatedButton.styleFrom(
          backgroundColor: theme.colorScheme.primary,
          foregroundColor: AppColors.textOnPrimary,
          disabledBackgroundColor: isDark 
            ? AppColors.gray700 
            : AppColors.gray300,
          disabledForegroundColor: isDark 
            ? AppColors.gray500 
            : AppColors.gray400,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.md),
          ),
          elevation: 2,
          shadowColor: theme.colorScheme.primary.withOpacity(0.3),
        );
      
      case ButtonVariant.secondary:
        return OutlinedButton.styleFrom(
          foregroundColor: theme.colorScheme.primary,
          disabledForegroundColor: isDark 
            ? AppColors.gray500 
            : AppColors.gray400,
          side: BorderSide(
            color: theme.colorScheme.primary,
            width: 1.5,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.md),
          ),
        );
      
      case ButtonVariant.tertiary:
        return TextButton.styleFrom(
          foregroundColor: theme.colorScheme.primary,
          disabledForegroundColor: isDark 
            ? AppColors.gray500 
            : AppColors.gray400,
        );
      
      case ButtonVariant.outlined:
        return OutlinedButton.styleFrom(
          foregroundColor: isDark 
            ? AppColors.white 
            : AppColors.textPrimary,
          side: BorderSide(
            color: isDark 
              ? AppColors.gray600 
              : AppColors.border,
            width: 1.5,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.md),
          ),
        );
    }
  }

  EdgeInsets _getPadding() {
    switch (size) {
      case ButtonSize.small:
        return EdgeInsets.symmetric(
          horizontal: AppSpacing.sm,
          vertical: AppSpacing.xs,
        );
      case ButtonSize.medium:
        return EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.sm,
        );
      case ButtonSize.large:
        return EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.md,
        );
    }
  }

  TextStyle _getTextStyle() {
    switch (size) {
      case ButtonSize.small:
        return AppTypography.labelLarge;
      case ButtonSize.medium:
        return AppTypography.labelLarge;
      case ButtonSize.large:
        return AppTypography.titleMedium;
    }
  }

  double _getLoadingSize() {
    switch (size) {
      case ButtonSize.small:
        return 16;
      case ButtonSize.medium:
        return 20;
      case ButtonSize.large:
        return 24;
    }
  }

  double _getIconSize() {
    switch (size) {
      case ButtonSize.small:
        return 16;
      case ButtonSize.medium:
        return 20;
      case ButtonSize.large:
        return 24;
    }
  }
}

enum ButtonSize { small, medium, large }
enum ButtonVariant { primary, secondary, tertiary, outlined }

/// =============================================
/// APP CARD COMPONENT
/// =============================================

class AppCard extends StatelessWidget {
  final Widget child;
  final EdgeInsets? padding;
  final Color? color;
  final double? elevation;
  final BorderRadius? borderRadius;
  final List<BoxShadow>? shadows;
  final VoidCallback? onTap;
  final bool hasBorder;

  const AppCard({
    Key? key,
    required this.child,
    this.padding,
    this.color,
    this.elevation,
    this.borderRadius,
    this.shadows,
    this.onTap,
    this.hasBorder = true,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    
    final cardColor = color ?? (isDark ? AppColors.gray800 : AppColors.white);
    final cardBorderRadius = borderRadius ?? BorderRadius.circular(AppRadius.lg);
    final cardPadding = padding ?? EdgeInsets.all(AppSpacing.cardPadding);
    final cardElevation = elevation ?? 2.0;
    final cardShadows = shadows ?? AppShadows.elevation2;

    Widget card = Container(
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: cardBorderRadius,
        boxShadow: cardShadows,
        border: hasBorder
            ? Border.all(
                color: isDark ? AppColors.gray700 : AppColors.border,
                width: 0.5,
              )
            : null,
      ),
      child: Padding(
        padding: cardPadding,
        child: child,
      ),
    );

    if (onTap != null) {
      card = GestureDetector(
        onTap: onTap,
        child: card,
      );
    }

    return card;
  }
}

/// =============================================
/// APP INPUT FIELD COMPONENT
/// =============================================

class AppInputField extends StatefulWidget {
  final String? label;
  final String? hintText;
  final TextEditingController? controller;
  final TextInputType? keyboardType;
  final bool obscureText;
  final Widget? prefixIcon;
  final Widget? suffixIcon;
  final String? Function(String?)? validator;
  final void Function(String)? onChanged;
  final int? maxLines;
  final int? maxLength;
  final bool enabled;
  final InputSize size;
  final InputVariant variant;

  const AppInputField({
    Key? key,
    this.label,
    this.hintText,
    this.controller,
    this.keyboardType,
    this.obscureText = false,
    this.prefixIcon,
    this.suffixIcon,
    this.validator,
    this.onChanged,
    this.maxLines = 1,
    this.maxLength,
    this.enabled = true,
    this.size = InputSize.medium,
    this.variant = InputVariant.filled,
  }) : super(key: key);

  @override
  State<AppInputField> createState() => _AppInputFieldState();
}

class _AppInputFieldState extends State<AppInputField> {
  late bool _obscureText;
  late FocusNode _focusNode;
  bool _isFocused = false;

  @override
  void initState() {
    super.initState();
    _obscureText = widget.obscureText;
    _focusNode = FocusNode()
      ..addListener(() {
        setState(() {
          _isFocused = _focusNode.hasFocus;
        });
      });
  }

  @override
  void dispose() {
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (widget.label != null) ...[
          Text(
            widget.label!,
            style: AppTypography.labelMedium.copyWith(
              color: isDark ? AppColors.white : AppColors.textPrimary,
            ),
          ),
          SizedBox(height: AppSpacing.xxs),
        ],
        TextFormField(
          controller: widget.controller,
          focusNode: _focusNode,
          keyboardType: widget.keyboardType,
          obscureText: _obscureText,
          validator: widget.validator,
          onChanged: widget.onChanged,
          maxLines: widget.maxLines,
          maxLength: widget.maxLength,
          enabled: widget.enabled,
          style: AppTypography.bodyMedium.copyWith(
            color: isDark ? AppColors.white : AppColors.textPrimary,
          ),
          decoration: InputDecoration(
            hintText: widget.hintText,
            hintStyle: AppTypography.bodyMedium.copyWith(
              color: isDark ? AppColors.gray400 : AppColors.textTertiary,
            ),
            prefixIcon: widget.prefixIcon,
            suffixIcon: widget.obscureText
                ? IconButton(
                    icon: Icon(
                      _obscureText ? Icons.visibility : Icons.visibility_off,
                      color: isDark ? AppColors.gray400 : AppColors.textTertiary,
                    ),
                    onPressed: () {
                      setState(() {
                        _obscureText = !_obscureText;
                      });
                    },
                  )
                : widget.suffixIcon,
            filled: widget.variant == InputVariant.filled,
            fillColor: isDark ? AppColors.gray800 : AppColors.gray50,
            border: _getBorderStyle(isDark, false),
            enabledBorder: _getBorderStyle(isDark, false),
            focusedBorder: _getBorderStyle(isDark, true),
            errorBorder: _getBorderStyle(isDark, false, isError: true),
            focusedErrorBorder: _getBorderStyle(isDark, true, isError: true),
            disabledBorder: _getBorderStyle(isDark, false, isDisabled: true),
            contentPadding: _getContentPadding(),
          ),
        ),
      ],
    );
  }

  OutlineInputBorder _getBorderStyle(bool isDark, bool isFocused,
      {bool isError = false, bool isDisabled = false}) {
    Color borderColor;
    
    if (isDisabled) {
      borderColor = isDark ? AppColors.gray700 : AppColors.border;
    } else if (isError) {
      borderColor = AppColors.error;
    } else if (isFocused) {
      borderColor = AppColors.borderFocus;
    } else {
      borderColor = isDark ? AppColors.gray700 : AppColors.border;
    }

    return OutlineInputBorder(
      borderRadius: BorderRadius.circular(AppRadius.md),
      borderSide: BorderSide(
        color: borderColor,
        width: isFocused ? 2.0 : 1.0,
      ),
    );
  }

  EdgeInsets _getContentPadding() {
    switch (widget.size) {
      case InputSize.small:
        return EdgeInsets.symmetric(
          horizontal: AppSpacing.sm,
          vertical: AppSpacing.xs,
        );
      case InputSize.medium:
        return EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.sm,
        );
      case InputSize.large:
        return EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.md,
        );
    }
  }
}

enum InputSize { small, medium, large }
enum InputVariant { filled, outlined }

/// =============================================
/// APP BADGE COMPONENT
/// =============================================

class AppBadge extends StatelessWidget {
  final String text;
  final BadgeVariant variant;
  final BadgeSize size;

  const AppBadge({
    Key? key,
    required this.text,
    this.variant = BadgeVariant.primary,
    this.size = BadgeSize.medium,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Container(
      padding: _getPadding(),
      decoration: BoxDecoration(
        color: _getBackgroundColor(theme),
        borderRadius: BorderRadius.circular(AppRadius.circular),
        border: Border.all(
          color: _getBorderColor(theme),
          width: 1,
        ),
      ),
      child: Text(
        text,
        style: _getTextStyle(theme),
      ),
    );
  }

  EdgeInsets _getPadding() {
    switch (size) {
      case BadgeSize.small:
        return EdgeInsets.symmetric(
          horizontal: AppSpacing.xs,
          vertical: AppSpacing.xxs,
        );
      case BadgeSize.medium:
        return EdgeInsets.symmetric(
          horizontal: AppSpacing.sm,
          vertical: AppSpacing.xs,
        );
      case BadgeSize.large:
        return EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.sm,
        );
    }
  }

  Color _getBackgroundColor(ThemeData theme) {
    switch (variant) {
      case BadgeVariant.primary:
        return theme.colorScheme.primary.withOpacity(0.1);
      case BadgeVariant.secondary:
        return theme.colorScheme.secondary.withOpacity(0.1);
      case BadgeVariant.success:
        return AppColors.success.withOpacity(0.1);
      case BadgeVariant.warning:
        return AppColors.warning.withOpacity(0.1);
      case BadgeVariant.error:
        return AppColors.error.withOpacity(0.1);
      case BadgeVariant.info:
        return AppColors.info.withOpacity(0.1);
    }
  }

  Color _getBorderColor(ThemeData theme) {
    switch (variant) {
      case BadgeVariant.primary:
        return theme.colorScheme.primary.withOpacity(0.3);
      case BadgeVariant.secondary:
        return theme.colorScheme.secondary.withOpacity(0.3);
      case BadgeVariant.success:
        return AppColors.success.withOpacity(0.3);
      case BadgeVariant.warning:
        return AppColors.warning.withOpacity(0.3);
      case BadgeVariant.error:
        return AppColors.error.withOpacity(0.3);
      case BadgeVariant.info:
        return AppColors.info.withOpacity(0.3);
    }
  }

  TextStyle _getTextStyle(ThemeData theme) {
    Color textColor;
    switch (variant) {
      case BadgeVariant.primary:
        textColor = theme.colorScheme.primary;
        break;
      case BadgeVariant.secondary:
        textColor = theme.colorScheme.secondary;
        break;
      case BadgeVariant.success:
        textColor = AppColors.success;
        break;
      case BadgeVariant.warning:
        textColor = AppColors.warning;
        break;
      case BadgeVariant.error:
        textColor = AppColors.error;
        break;
      case BadgeVariant.info:
        textColor = AppColors.info;
        break;
    }

    switch (size) {
      case BadgeSize.small:
        return AppTypography.labelSmall.copyWith(color: textColor);
      case BadgeSize.medium:
        return AppTypography.labelMedium.copyWith(color: textColor);
      case BadgeSize.large:
        return AppTypography.labelLarge.copyWith(color: textColor);
    }
  }
}

enum BadgeVariant { primary, secondary, success, warning, error, info }
enum BadgeSize { small, medium, large }

/// =============================================
/// APP DIVIDER COMPONENT
/// =============================================

class AppDivider extends StatelessWidget {
  final double? height;
  final double thickness;
  final Color? color;
  final EdgeInsets? margin;

  const AppDivider({
    Key? key,
    this.height,
    this.thickness = 1.0,
    this.color,
    this.margin,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final dividerColor = color ?? (isDark ? AppColors.gray700 : AppColors.border);

    Widget divider = Divider(
      height: height,
      thickness: thickness,
      color: dividerColor,
    );

    if (margin != null) {
      divider = Padding(
        padding: margin!,
        child: divider,
      );
    }

    return divider;
  }
}