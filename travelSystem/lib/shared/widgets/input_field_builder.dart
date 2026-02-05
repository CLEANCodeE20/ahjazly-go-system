import 'package:flutter/material.dart';

import '../../core/constants/Color.dart';
import '../../core/constants/dimensions.dart';

class _InputFieldState extends StatefulWidget {
  final String? Function(String?) validator;
  final TextEditingController controller;
  final String label;
  final IconData icon;
  final bool obscure;
  final Widget? suffixIcon;
  final void Function(String)? onChanged;
  final bool readOnly;
  final bool enabled;

  const _InputFieldState({
    required this.validator,
    required this.controller,
    required this.label,
    required this.icon,
    required this.obscure,
    this.suffixIcon,
    this.onChanged,
    this.readOnly = false,
    this.enabled = true,
  });

  @override
  State<_InputFieldState> createState() => _InputFieldStateState();
}

class _InputFieldStateState extends State<_InputFieldState> {
  bool _isFocused = false;

  @override
  Widget build(BuildContext context) {
    final bool effectiveEnabled = widget.enabled && !widget.readOnly;

    return AnimatedContainer(
      duration: AppDimensions.animationDurationMedium,
      margin: const EdgeInsets.only(bottom: 0),
      decoration: BoxDecoration(
        gradient: _isFocused && effectiveEnabled
            ? LinearGradient(
          colors: [
            AppColor.primaryLighter,
            AppColor.primaryLighter.withOpacity(0.8),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        )
            : null,
        color: _isFocused && effectiveEnabled ? null : AppColor.color_secondary,
        border: Border.all(
          color:
          _isFocused && effectiveEnabled ? AppColor.primary : Colors.grey.shade300,
          width: _isFocused && effectiveEnabled ? 2 : 1,
        ),
        borderRadius: BorderRadius.circular(AppDimensions.radiusLarge),
        boxShadow: [
          BoxShadow(
            color: _isFocused && effectiveEnabled
                ? AppColor.warning.withOpacity(0.15)
                : Colors.black.withOpacity(0.05),
            blurRadius: _isFocused && effectiveEnabled ? 12 : 4,
            spreadRadius: _isFocused && effectiveEnabled ? 2 : 1,
            offset: Offset(0, _isFocused && effectiveEnabled ? 4 : 2),
          ),
        ],
      ),
      child: Focus(
        onFocusChange: (hasFocus) {
          if (!effectiveEnabled) return;
          setState(() {
            _isFocused = hasFocus;
          });
        },
        child: TextFormField(
          validator: widget.validator,
          controller: widget.controller,
          obscureText: widget.obscure,
          readOnly: widget.readOnly,
          enabled: widget.enabled,
          textAlign: TextAlign.right,
          style: TextStyle(
            fontFamily: 'Cairo',
            fontSize: AppDimensions.fontSizeLarge,
            color: AppColor.textPrimary,
          ),
          decoration: InputDecoration(
            labelText: widget.label,
            labelStyle: TextStyle(
              fontFamily: 'Cairo',
              fontSize: AppDimensions.fontSizeLarge,
              color: _isFocused && effectiveEnabled
                  ? AppColor.primary
                  : AppColor.textSecondary,
              fontWeight:
              _isFocused && effectiveEnabled ? FontWeight.w600 : FontWeight.normal,
            ),
            prefixIcon: AnimatedContainer(
              duration: AppDimensions.animationDurationMedium,
              child: Icon(
                widget.icon,
                size: AppDimensions.iconSizeMedium,
                color: _isFocused && effectiveEnabled
                    ? AppColor.primary
                    : AppColor.textSecondary,
              ),
            ),
            suffixIcon: widget.suffixIcon,
            border: InputBorder.none,
            contentPadding: EdgeInsets.symmetric(
              horizontal: AppDimensions.paddingMedium,
              vertical: AppDimensions.paddingMedium,
            ),
          ),
          onChanged: widget.onChanged,
        ),
      ),
    );
  }
}

Widget buildInputField(
    String? Function(String?) validator,
    TextEditingController controller,
    String label,
    IconData icon,
    bool obscure, {
      Widget? suffixIcon,
      void Function(String)? onChanged,
      bool readOnly = false,
      bool enabled = true,
    }) {
  return _InputFieldState(
    validator: validator,
    controller: controller,
    label: label,
    icon: icon,
    obscure: obscure,
    suffixIcon: suffixIcon,
    onChanged: onChanged,
    readOnly: readOnly,
    enabled: enabled,
  );
}
