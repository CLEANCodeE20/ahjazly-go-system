import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../../core/constants/Color.dart';
import '../../../../core/constants/dimensions.dart';

class LoginTypeTab extends StatelessWidget {
  final String text;
  final bool isSelected;
  final VoidCallback onTap;
  final double borderRadius;

  const LoginTypeTab({
    Key? key,
    required this.text,
    required this.isSelected,
    required this.onTap,
    required this.borderRadius,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: EdgeInsets.symmetric(vertical: AppDimensions.paddingSmall),
          decoration: BoxDecoration(
            color: isSelected ? AppColor.color_primary : Colors.transparent,
            borderRadius: BorderRadius.circular(borderRadius),
            border: Border.all(color: AppColor.color_primary),
          ),
          child: Center(
            child: Text(
              text.tr,
              style: TextStyle(
                color: isSelected ? Colors.white : AppColor.color_primary,
                fontWeight: FontWeight.bold,
                fontFamily: 'Cairo',
              ),
            ),
          ),
        ),
      ),
    );
  }
}
