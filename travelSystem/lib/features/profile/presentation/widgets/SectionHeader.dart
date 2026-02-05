import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../../core/constants/Color.dart';
import '../../../../core/constants/dimensions.dart';



class SectionHeader extends StatelessWidget {
  final String title;
  final String? subtitle;
  final IconData? icon;

  const SectionHeader({
    required this.title,
    this.subtitle,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      margin: EdgeInsets.only(bottom: AppDimensions.marginSmall),
      child: Row(
        children: [
          // Decorative accent line
          Container(
            width: 4,
            height: 24,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  theme.colorScheme.primary,
                  theme.colorScheme.primary.withOpacity(0.5),
                ],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
              borderRadius: BorderRadius.circular(AppDimensions.radiusSmall),
            ),
          ),
          SizedBox(width: AppDimensions.spacingSmall),
          // Icon (optional)
          if (icon != null) ...[
            Container(
              padding: EdgeInsets.all(AppDimensions.paddingSmall),
              decoration: BoxDecoration(
                color: theme.colorScheme.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
              ),
              child: Icon(
                icon,
                size: AppDimensions.iconSizeMedium,
                color: theme.colorScheme.primary,
              ),
            ),
            SizedBox(width: AppDimensions.spacingSmall),
          ],
          // Title and subtitle
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title.tr,
                  style: theme.textTheme.titleLarge?.copyWith(
                    fontSize: AppDimensions.fontSizeXXLarge,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                if (subtitle != null) ...[
                  SizedBox(height: AppDimensions.spacingXSmall),
                  Text(
                    subtitle!.tr,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontSize: AppDimensions.fontSizeMedium,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}