import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../core/constants/Color.dart';
import '../../core/constants/dimensions.dart';

class SectionTitle extends StatelessWidget {
  final String title;
  const SectionTitle({required this.title});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 10, top: 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title.tr,
            style: TextStyle(
              color: theme.brightness == Brightness.dark ? Colors.white : AppColor.textPrimary,
              fontWeight: FontWeight.bold,
              fontSize: AppDimensions.fontSizeLarge,
              fontFamily: "Cairo",
              letterSpacing: 0.3,
            ),
          ),
          Divider(
            endIndent: 90,
            indent: 0,
            height: 14,
            thickness: 1,
            color: theme.brightness == Brightness.dark
                ? AppColor.primary.withOpacity(0.5)
                : AppColor.divider,
          ),
        ],
      ),
    );
  }
}