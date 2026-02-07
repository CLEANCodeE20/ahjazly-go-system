import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../../core/constants/nameRoute.dart';
import '../../../auth/controller/AuthService.dart';
import '../../../../core/constants/Color.dart';

class DriverProfileView extends StatelessWidget {
  const DriverProfileView({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final authService = Get.find<AuthService>();

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FD),
      appBar: AppBar(
        title: const Text('الملف الشخصي', style: TextStyle(fontWeight: FontWeight.bold, fontFamily: 'Cairo')),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        physics: const BouncingScrollPhysics(),
        child: Column(
          children: [
            // 1. Profile Header
            _buildProfileHeader(authService),
            const SizedBox(height: 30),

            // 2. Account Info Section
            _buildSectionTitle('معلومات الحساب'),
            _buildSettingsGroup([
              _buildProfileItem(
                icon: Icons.badge_rounded,
                title: 'نوع الحساب',
                subtitle: 'سائق معتمد',
                color: Colors.blue,
              ),
              _buildProfileItem(
                icon: Icons.email_rounded,
                title: 'البريد الإلكتروني',
                subtitle: authService.userEmail ?? '',
                color: Colors.purple,
              ),
              _buildProfileItem(
                icon: Icons.phone_rounded,
                title: 'رقم الهاتف',
                subtitle: authService.userPhone ?? '',
                color: Colors.orange,
              ),
            ]),
            const SizedBox(height: 24),

            // 3. Performance & Work
            _buildSectionTitle('العمل والأداء'),
            _buildSettingsGroup([
              _buildProfileItem(
                icon: Icons.history_rounded,
                title: 'سجل الرحلات',
                onTap: () => Get.toNamed(AppRoute.DriverHistory),
                color: Colors.indigo,
              ),
              _buildProfileItem(
                icon: Icons.trending_up_rounded,
                title: 'الأداء والتقييمات',
                onTap: () => Get.toNamed(AppRoute.DriverPerformance),
                color: Colors.teal,
              ),
              _buildProfileItem(
                icon: Icons.folder_shared_rounded,
                title: 'المستندات والوثائق',
                onTap: () => Get.toNamed(AppRoute.DriverDocuments),
                color: Colors.brown,
              ),
            ]),
            const SizedBox(height: 24),

            // 4. App Settings & Mode
            _buildSectionTitle('الإعدادات والتطبيق'),
            _buildSettingsGroup([
              _buildProfileItem(
                icon: Icons.swap_horiz_rounded,
                title: 'التبديل لوضع العميل',
                subtitle: 'تصفح التطبيق كعميل',
                onTap: () => Get.offAllNamed(AppRoute.MainController),
                color: AppColor.color_primary,
                isHighlight: true,
              ),
              _buildProfileItem(
                icon: Icons.settings_rounded,
                title: 'إعدادات القيادة',
                onTap: () => Get.toNamed(AppRoute.DriverSettings),
                color: Colors.grey,
              ),
              _buildProfileItem(
                icon: Icons.lock_outline_rounded,
                title: 'تغيير كلمة المرور',
                onTap: () {
                  // TODO: Implement change password
                },
                color: Colors.redAccent,
              ),
              _buildProfileItem(
                icon: Icons.help_outline_rounded,
                title: 'المساعدة والدعم',
                onTap: () => Get.toNamed('/SupportAndHelp'),
                color: Colors.blueGrey,
              ),
            ]),
            const SizedBox(height: 40),

            // 5. Logout Button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => _showLogoutConfirmation(context, authService),
                icon: const Icon(Icons.logout_rounded, color: Colors.white),
                label: const Text('تسجيل الخروج', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontFamily: 'Cairo')),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFFF5252),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
              ),
            ).animate().fadeIn(delay: 400.ms).slideY(begin: 0.2, end: 0),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileHeader(AuthService authService) {
    return Column(
      children: [
        Stack(
          alignment: Alignment.bottomRight,
          children: [
            Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: AppColor.color_primary, width: 3),
              ),
              child: const CircleAvatar(
                radius: 60,
                backgroundColor: Color(0xFFE0E0E0),
                backgroundImage: AssetImage('assets/images/driver_avatar_placeholder.png'),
                child: Icon(Icons.person, size: 60, color: Colors.white),
              ),
            ),
            Container(
              padding: const EdgeInsets.all(8),
              decoration:  BoxDecoration(
                color: AppColor.color_primary,

              ),
              child: const Icon(Icons.camera_alt_rounded, color: Colors.white, size: 20),
            ),
          ],
        ).animate().scale(duration: 400.ms, curve: Curves.easeOutBack),
        const SizedBox(height: 16),
        Text(
          authService.userName ?? 'السائق',
          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, fontFamily: 'Cairo'),
        ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.2, end: 0),
        const SizedBox(height: 4),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: BoxDecoration(
            color: AppColor.color_primary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            authService.userPhone ?? '',
            style:  TextStyle(fontSize: 14, color: AppColor.color_primary, fontWeight: FontWeight.bold),
          ),
        ).animate().fadeIn(delay: 300.ms).slideY(begin: 0.2, end: 0),
      ],
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12, right: 4),
      child: Align(
        alignment: Alignment.centerRight,
        child: Text(
          title,
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.grey, fontFamily: 'Cairo'),
        ),
      ),
    );
  }

  Widget _buildSettingsGroup(List<Widget> children) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        children: children.asMap().entries.map((entry) {
          final index = entry.key;
          final widget = entry.value;
          return Column(
            children: [
              widget,
              if (index != children.length - 1)
                Divider(height: 1, indent: 60, endIndent: 20, color: Colors.grey.withOpacity(0.1)),
            ],
          );
        }).toList(),
      ),
    ).animate().fadeIn(duration: 400.ms).slideX(begin: 0.05, end: 0);
  }

  Widget _buildProfileItem({
    required IconData icon,
    required String title,
    String? subtitle,
    VoidCallback? onTap,
    required Color color,
    bool isHighlight = false,
  }) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      leading: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(icon, color: color, size: 22),
      ),
      title: Text(
        title,
        style: TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          fontFamily: 'Cairo',
          color: isHighlight ? AppColor.color_primary : Colors.black87,
        ),
      ),
      subtitle: subtitle != null
          ? Text(
              subtitle,
              style: TextStyle(fontSize: 13, color: Colors.grey[500], fontFamily: 'Cairo'),
            )
          : null,
      trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 16, color: Colors.grey),
      onTap: onTap,
    );
  }

  void _showLogoutConfirmation(BuildContext context, AuthService authService) {
    Get.dialog(
      AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('تسجيل الخروج', style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.bold)),
        content: const Text('هل أنت متأكد أنك تريد تسجيل الخروج؟', style: TextStyle(fontFamily: 'Cairo')),
        actions: [
          TextButton(
            onPressed: () => Get.back(),
            child: const Text('إلغاء', style: TextStyle(fontFamily: 'Cairo', color: Colors.grey)),
          ),
          TextButton(
            onPressed: () {
              Get.back();
              authService.logout();
            },
            child: const Text('نعم، خروج', style: TextStyle(fontFamily: 'Cairo', color: Colors.red, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}
