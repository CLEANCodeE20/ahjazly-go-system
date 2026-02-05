import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../controller/driver_settings_controller.dart';
import '../../../../core/constants/Color.dart';

class DriverSettingsView extends StatelessWidget {
  const DriverSettingsView({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(DriverSettingsController());

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      body: Stack(
        children: [
          // Header Background
          Container(
            height: 180,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topRight,
                end: Alignment.bottomLeft,
                colors: [
                  AppColor.color_primary,
                  AppColor.color_primary.withOpacity(0.8),
                ],
              ),
              borderRadius: const BorderRadius.only(
                bottomLeft: Radius.circular(30),
                bottomRight: Radius.circular(30),
              ),
            ),
          ),

          SafeArea(
            child: Column(
              children: [
                _buildHeader(),
                Expanded(
                  child: Obx(() {
                    if (controller.isLoading.value) {
                      return const Center(child: CircularProgressIndicator());
                    }

                    return SingleChildScrollView(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: [
                          _buildSettingsGroup(
                            title: 'التنبيهات',
                            children: [
                              _buildSwitchTile(
                                title: 'تفعيل التنبيهات',
                                subtitle: 'تلقي إشعارات بخصوص الرحلات الجديدة والطلبات',
                                icon: Icons.notifications_active,
                                value: controller.notificationsEnabled.value,
                                onChanged: (val) {
                                  controller.notificationsEnabled.value = val;
                                  controller.updateSetting('notifications_enabled', val);
                                },
                              ),
                            ],
                          ),
                          const SizedBox(height: 20),
                          _buildSettingsGroup(
                            title: 'الخصوصية والموقع',
                            children: [
                              _buildSwitchTile(
                                title: 'تتبع الموقع',
                                subtitle: 'السماح للتطبيق بتتبع موقعك أثناء الرحلة',
                                icon: Icons.location_on,
                                value: controller.trackLocation.value,
                                onChanged: (val) {
                                  controller.trackLocation.value = val;
                                  controller.updateSetting('track_location', val);
                                },
                              ),
                            ],
                          ),
                          const SizedBox(height: 20),
                          _buildSettingsGroup(
                            title: 'تفضيلات الرحلة',
                            children: [
                              _buildSwitchTile(
                                title: 'قبول الرحلات تلقائياً',
                                subtitle: 'قبول أي رحلة يتم إسنادها إليك فوراً',
                                icon: Icons.auto_mode,
                                value: controller.autoAcceptTrips.value,
                                onChanged: (val) {
                                  controller.autoAcceptTrips.value = val;
                                  controller.updateSetting('auto_accept_trips', val);
                                },
                              ),
                            ],
                          ),
                          const SizedBox(height: 20),
                          _buildSettingsGroup(
                            title: 'التطبيق',
                            children: [
                              _buildActionTile(
                                title: 'لغة التطبيق',
                                subtitle: controller.language.value == 'ar' ? 'العربية' : 'English',
                                icon: Icons.language,
                                onTap: () {
                                  // TODO: Language selection dialog
                                },
                              ),
                            ],
                          ),
                        ],
                      ),
                    );
                  }),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Row(
        children: [
          Container(
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: IconButton(
              icon: const Icon(Icons.arrow_back, color: Colors.white),
              onPressed: () => Get.back(),
            ),
          ),
          const SizedBox(width: 16),
          const Text(
            'الإعدادات',
            style: TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSettingsGroup({required String title, required List<Widget> children}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          child: Text(
            title,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: Colors.grey[600],
            ),
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.03),
                blurRadius: 10,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            children: children.asMap().entries.map((entry) {
              final index = entry.key;
              final child = entry.value;
              return Column(
                children: [
                  child,
                  if (index < children.length - 1)
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Divider(height: 1, color: Colors.grey[100]),
                    ),
                ],
              );
            }).toList(),
          ),
        ),
      ],
    );
  }

  Widget _buildSwitchTile({
    required String title,
    required String subtitle,
    required IconData icon,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: SwitchListTile(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColor.color_primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, size: 20, color: AppColor.color_primary),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                title,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
            ),
          ],
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(right: 44), // Align with text
          child: Text(
            subtitle,
            style: TextStyle(fontSize: 12, color: Colors.grey[500]),
          ),
        ),
        value: value,
        onChanged: onChanged,
        activeColor: AppColor.color_primary,
      ),
    );
  }

  Widget _buildActionTile({
    required String title,
    required String subtitle,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return ListTile(
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: AppColor.color_primary.withOpacity(0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, size: 20, color: AppColor.color_primary),
      ),
      title: Text(
        title,
        style: const TextStyle(
          fontWeight: FontWeight.bold,
          fontSize: 14,
        ),
      ),
      subtitle: Text(
        subtitle,
        style: TextStyle(fontSize: 12, color: Colors.grey[500]),
      ),
      trailing: Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey[400]),
    );
  }
}
