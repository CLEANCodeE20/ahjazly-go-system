// file: view/Widget/widget_Butoon.dart

import 'package:flutter/material.dart';
import 'package:travelsystem/core/constants/Color.dart';

import '../../core/constants/dimensions.dart';

class WidegtBtuoon extends StatelessWidget {
  final VoidCallback? onPressed;
  final Color backgroundColor;
  final String? text;
  final Widget? child;
  final bool isLoading; // New property

  const WidegtBtuoon({
    super.key,
    required this.onPressed,
    required this.backgroundColor,
    this.text,
    this.child,
    this.isLoading = false, // Default to false
  }) : assert(text != null || child != null, 'يجب توفير إما text أو child');

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 56, // Standard height
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: backgroundColor,
          disabledBackgroundColor: backgroundColor.withOpacity(0.6),
          padding: const EdgeInsets.symmetric(vertical: AppDimensions.paddingSmall),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppDimensions.radiusXLarge),
          ),
          elevation: (onPressed == null || isLoading) ? 0 : 2,
        ),
        onPressed: isLoading ? null : onPressed,
        child: isLoading
            ? const SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(
                  color: AppColor.primaryLighter,
                  strokeWidth: 2.5,
                ),
              )
            : child ??
                Text(
                  text ?? '',
                  style: const TextStyle(
                    color: AppColor.primaryLighter,
                    fontWeight: FontWeight.bold,
                    fontSize: AppDimensions.fontSizeXLarge,
                    fontFamily: 'Cairo',
                  ),
                ),
      ),
    );
  }
}
