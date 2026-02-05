import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../../core/constants/Color.dart';
import '../../../../core/constants/dimensions.dart';



class SupportContactCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String text;
  final String textButton;
  final VoidCallback? onPressed;

  const SupportContactCard({
    super.key,
    required this.icon,
    required this.title,
    required this.text,
    required this.textButton,
    this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(AppDimensions.paddingLarge),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppDimensions.radiusXLarge),
        boxShadow: [
          BoxShadow(
            color: AppColor.primary.withOpacity(0.08),
            blurRadius: 20,
            spreadRadius: 2,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          // Icon container
          Container(
            padding: EdgeInsets.all(AppDimensions.paddingMedium),
            decoration: BoxDecoration(
              gradient: AppGradients.primaryGradient,
              borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
            ),
            child: Icon(
              icon,
              color: Colors.white,
              size: AppDimensions.iconSizeMedium,
            ),
          ),
          SizedBox(width: AppDimensions.spacingMedium),
          
          // Text content
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title.tr,
                  style: TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: AppDimensions.fontSizeLarge,
                    fontWeight: FontWeight.bold,
                    color: AppColor.textPrimary,
                  ),
                ),
                SizedBox(height: AppDimensions.spacingXSmall),
                Text(
                  text.tr,
                  style: TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: AppDimensions.fontSizeMedium,
                    color: AppColor.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          
          // Button
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: onPressed,
              borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
              child: Container(
                padding: EdgeInsets.symmetric(
                  horizontal: AppDimensions.paddingMedium,
                  vertical: AppDimensions.paddingSmall,
                ),
                decoration: BoxDecoration(
                  color: AppColor.primaryLighter,
                  borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
                  border: Border.all(
                    color: AppColor.primary.withOpacity(0.3),
                    width: 1,
                  ),
                ),
                child: Text(
                  textButton.tr,
                  style: TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: AppDimensions.fontSizeSmall,
                    fontWeight: FontWeight.w600,
                    color: AppColor.primary,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
