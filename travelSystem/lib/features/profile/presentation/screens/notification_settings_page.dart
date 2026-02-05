import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../../core/constants/Color.dart';
import '../../../../core/constants/dimensions.dart';
import '../../controller/notification_settings_controller.dart';
import '../widgets/notification_setting_tile.dart';

class NotificationSettingsPage extends StatelessWidget {
  const NotificationSettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final controller = Get.find<NotificationSettingsController>();

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: theme.appBarTheme.backgroundColor,
        elevation: isDark ? 0 : 0.5,
        foregroundColor: isDark ? Colors.white : AppColor.textPrimary,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 20),
          onPressed: () => Get.back(),
        ),
        title: Text(
          'إعدادات الإشعارات'.tr,
          style: TextStyle(
            fontFamily: 'Cairo',
            fontWeight: FontWeight.bold,
            fontSize: 18,
            color: isDark ? Colors.white : Colors.black,
          ),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Global Mute Toggle Header
            _buildGlobalToggle(controller),
            
            const SizedBox(height: 30),
            
            // Notifications Sections
            _buildSectionHeader('تنبيهات الرحلات'.tr, Icons.directions_bus_filled_outlined,context),
            ...controller.options
                .where((opt) => opt.category == 'تنبيهات الرحلات')
                .map((opt) => NotificationSettingTile(option: opt)),
            
            const SizedBox(height: 20),
            _buildSectionHeader('العروض والتخفيضات'.tr, Icons.card_giftcard_rounded,context),
            ...controller.options
                .where((opt) => opt.category == 'العروض الترويجية')
                .map((opt) => NotificationSettingTile(option: opt)),
                
            const SizedBox(height: 20),
            _buildSectionHeader('القنوات تواصل'.tr, Icons.contact_support_outlined,context),
            ...controller.options
                .where((opt) => opt.category == 'قنوات التواصل')
                .map((opt) => NotificationSettingTile(option: opt)),
                
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildGlobalToggle(NotificationSettingsController controller) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColor.color_primary, AppColor.color_primary.withOpacity(0.8)],
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          const Icon(Icons.notifications_active, color: Colors.white, size: 28),
          const SizedBox(width: 15),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'تفعيل كل الإشعارات'.tr,
                  style: const TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                Text(
                  'تلقي كافة التنبيهات والرسائل الهامة'.tr,
                  style: TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 12,
                    color: Colors.white.withOpacity(0.9),
                  ),
                ),
              ],
            ),
          ),
          Obx(() => Switch(
            value: controller.isGlobalEnabled.value,
            onChanged: (val) => controller.toggleGlobal(val),
            activeColor: Colors.white,
            activeTrackColor: Colors.greenAccent.shade400,
          )),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon,context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 15, left: 5, right: 5),
      child: Row(
        children: [
          Icon(icon, size: 20, color: AppColor.textSecondary),
          const SizedBox(width: 10),
          Text(
            title,
            style: TextStyle(
              fontFamily: 'Cairo',
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Theme.of(context).brightness == Brightness.dark ? Colors.white : AppColor.textPrimary,
            ),
          ),
        ],
      ),
    );
  }
}
