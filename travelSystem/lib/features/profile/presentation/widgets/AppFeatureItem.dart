import 'package:flutter/material.dart';

import '../../../../core/constants/Color.dart';
import '../../../../core/constants/dimensions.dart';



class AppFeatureItem extends StatelessWidget {
  final IconData icon;
  final String text;

  const AppFeatureItem({
    super.key,
    required this.icon,
    required this.text,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: AppDimensions.paddingXSmall),
      child: Row(
        children: [
          Container(
            padding: EdgeInsets.all(AppDimensions.paddingSmall),
            decoration: BoxDecoration(
              color: AppColor.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
            ),
            child: Icon(
              icon,
              size: AppDimensions.iconSizeSmall,
              color: AppColor.primary,
            ),
          ),
          SizedBox(width: AppDimensions.spacingSmall),
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                fontFamily: 'Cairo',
                fontSize: AppDimensions.fontSizeMedium,
                color: AppColor.textSecondary,
                height: 1.6,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
