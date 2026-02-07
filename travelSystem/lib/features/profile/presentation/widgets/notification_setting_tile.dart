import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../../core/constants/Color.dart';
import '../../../../core/constants/dimensions.dart';
import '../../data/models/notification_option.dart';
import '../../controller/notification_settings_controller.dart';

class NotificationSettingTile extends StatelessWidget {
  final NotificationOption option;
  const NotificationSettingTile({super.key, required this.option});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final optionColor = option.color ?? AppColor.primary;
    final controller = Get.find<NotificationSettingsController>();

    return Container(
      margin: EdgeInsets.only(bottom: AppDimensions.spacingMedium),
      padding: EdgeInsets.all(AppDimensions.paddingMedium),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(20), // Larger radius for premium feel
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.2 : 0.04),
            blurRadius: 15,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        children: [
          // Icon with Light Colored Background
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: optionColor.withOpacity(0.12),
              borderRadius: BorderRadius.circular(15),
            ),
            child: Icon(
              option.icon,
              color: optionColor,
              size: 24,
            ),
          ),
          const SizedBox(width: 16),

          // Title & Subtitle
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  option.title.tr,
                  style: TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: isDark ? Colors.white : const Color(0xFF1A1A1A),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  option.subtitle.tr,
                  style: TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 12,
                    color: isDark ? Colors.white54 : Colors.grey.shade600,
                    height: 1.3,
                  ),
                ),
              ],
            ),
          ),

          // Custom Style Switch
          Obx(() {
            final value = controller.toggles[option.id]?.value ?? false;
            return Switch(
              value: value,
              onChanged: (val) => controller.toggleOption(option.id, val),
              activeColor: Colors.white,
              activeTrackColor: optionColor,
              inactiveThumbColor: isDark ? Colors.white24 : Colors.white,
              inactiveTrackColor: isDark ? Colors.white10 : const Color(0xFFE0E0E0),
            );
          }),
        ],
      ),
    );
  }
}
