import 'package:flutter/material.dart';

import '../../core/constants/Color.dart';
import '../../core/constants/dimensions.dart';

Widget bottomBarItem({
  required String image,
  required String activeImage,
  required String label,
  required bool isActive,
  required VoidCallback onTap,
}) {
  return Builder(
    builder: (context) {
      final isDark = Theme.of(context).brightness == Brightness.dark;
      
      return Expanded(
        child: InkWell(
          borderRadius: BorderRadius.circular(AppDimensions.radiusXLarge),
          onTap: onTap,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 250),
            curve: Curves.easeOut,
            padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 12),
            decoration: BoxDecoration(
              color: isActive
                  ? Theme.of(context).colorScheme.primary.withOpacity(0.08)
                  : Colors.transparent,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                SizedBox(
                  height: 24,
                  child: Image.asset(
                    isActive ? activeImage : image,
                    color: isActive 
                        ? Theme.of(context).colorScheme.primary 
                        : (isDark ? Colors.grey.shade500 : Colors.grey.shade400),
                    colorBlendMode: BlendMode.srcIn,
                  ),
                ),
                const SizedBox(height: 4),
                // The Indicator Bar from the image
                AnimatedContainer(
                  duration: const Duration(milliseconds: 250),
                  width: isActive ? 16 : 0,
                  height: 4,
                  decoration: BoxDecoration(
                    color: isActive ? Theme.of(context).colorScheme.primary : Colors.transparent,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 11,
                    fontFamily: 'Cairo',
                    fontWeight: isActive ? FontWeight.bold : FontWeight.w600,
                    color: isActive 
                        ? Theme.of(context).colorScheme.primary 
                        : (isDark ? Colors.grey.shade500 : Colors.grey.shade400),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    },
  );
}
