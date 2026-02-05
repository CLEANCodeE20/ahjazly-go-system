// view/screen/profile/edit_profile_page.dart
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../../../core/constants/Color.dart';
import '../../../../core/constants/dimensions.dart';
import '../../../../core/functions/validatorInput.dart';
import '../../../auth/controller/AuthService.dart';
import '../../controller/edit_profile_controller.dart';



import '../../../../shared/widgets/input_field_builder.dart';
import '../widgets/SectionHeader.dart';
import '../widgets/ProfileImageSection.dart';

class EditProfilePage extends StatefulWidget {
  const EditProfilePage({super.key});

  @override
  State<EditProfilePage> createState() => _EditProfilePageState();
}

class _EditProfilePageState extends State<EditProfilePage>
    with SingleTickerProviderStateMixin {
  final EditProfileController controller = Get.find<EditProfileController>();

  final authService = Get.find<AuthService>();

  @override
  void initState() {
    super.initState();
  }

  @override
  void dispose() {
    super.dispose();
  }

  Widget _buildSectionCard({required Widget child}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      margin: EdgeInsets.only(
        top: AppDimensions.marginMedium,
        bottom: AppDimensions.marginSmall,
      ),
      padding: EdgeInsets.all(AppDimensions.paddingLarge),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(AppDimensions.radiusXLarge),
        boxShadow: [
          BoxShadow(
            color: isDark ? Colors.black26 : AppColor.primary.withOpacity(0.08),
            blurRadius: 20,
            spreadRadius: 2,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: child,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor, // Slightly cleaner background
      body: Obx(
        () => CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            // Custom Premium Header
            SliverAppBar(
              expandedHeight: 220,
              pinned: true,
              stretch: true,
              backgroundColor: AppColor.color_primary,
              elevation: 0,
              leading: IconButton(
                icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 20),
                onPressed: () => Get.back(),
              ),
              centerTitle: true,
              title: const Text(
                "الإعدادات الشخصية",
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                  color: Colors.white,
                ),
              ),
              flexibleSpace: FlexibleSpaceBar(
                background: Stack(
                  fit: StackFit.expand,
                  children: [
                    // Background Gradient/Image
                    Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            AppColor.primary,
                            AppColor.primary.withOpacity(0.8),
                          ],
                        ),
                      ),
                    ),
                    // Profile Image Integrated
                    Positioned(
                      bottom: 20,
                      left: 0,
                      right: 0,
                      child: Obx(() {
                        final profile = controller.currentProfile.value;
                        final hasImage = profile?.profileImage != null && profile!.profileImage!.isNotEmpty;
                        
                        return Column(
                          children: [
                            Stack(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(4),
                                  decoration: BoxDecoration(
                                    color: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF1E293B) : Colors.white,
                                    shape: BoxShape.circle,
                                  ),
                                  child: CircleAvatar(
                                    radius: 45,
                                    backgroundColor: Colors.grey.shade200,
                                    backgroundImage: hasImage 
                                        ? NetworkImage(profile.profileImage!) 
                                        : null,
                                    child: !hasImage
                                        ? Text(
                                            (profile?.fullName.isNotEmpty == true)
                                                ? profile!.fullName[0].toUpperCase()
                                                : 'U',
                                            style: TextStyle(
                                              fontSize: 40,
                                              fontWeight: FontWeight.bold,
                                              color: AppColor.color_primary,
                                            ),
                                          )
                                        : null,
                                  ),
                                ),
                                Positioned(
                                  bottom: 0,
                                  right: 0,
                                  child: GestureDetector(
                                    onTap: controller.pickAndUploadImage,
                                    child: Container(
                                      padding: const EdgeInsets.all(8),
                                      decoration: BoxDecoration(
                                        color: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF334155) : Colors.white,
                                        shape: BoxShape.circle,
                                        boxShadow: [
                                          BoxShadow(
                                            color: Colors.black.withOpacity(0.1),
                                            blurRadius: 8,
                                            offset: const Offset(0, 2),
                                          ),
                                        ],
                                      ),
                                      child: Icon(
                                        Icons.camera_alt,
                                        size: 18,
                                        color: AppColor.color_primary,
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        );
                      }),
                    ),
                  ],
                ),
              ),
            ),

            // Content
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 25),
                child: Column(
                  children: [
                    // --- Personal Info Section ---
                    _buildPremiumSection(
                      title: 'المعلومات الشخصية',
                      icon: Icons.person_rounded,
                      child: Column(
                        children: [
                          _buildModernTextField(
                            label: 'الاسم الكامل',
                            controller: controller.nameController,
                            icon: Icons.person_outline,
                            enabled: true,
                          ),
                          const SizedBox(height: 15),
                          _buildModernTextField(
                            label: 'البريد الإلكتروني',
                            controller: controller.emailController,
                            icon: Icons.email_outlined,
                            enabled: false,
                          ),
                          const SizedBox(height: 15),
                          _buildModernTextField(
                            label: 'رقم الهاتف',
                            controller: controller.phoneController,
                            icon: Icons.phone_android_rounded,
                            enabled: true,
                          ),
                        ],
                      ),
                    ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.1, end: 0),

                    const SizedBox(height: 25),

                    // --- Password Change Section ---
                    _buildPremiumSection(
                      title: 'أمان الحساب',
                      icon: Icons.security_rounded,
                      child: Column(
                        children: [
                          _buildModernTextField(
                            label: 'كلمة المرور الحالية',
                            controller: controller.currentPasswordController,
                            icon: Icons.lock_outline,
                            isPassword: true,
                          ),
                          const SizedBox(height: 15),
                          _buildModernTextField(
                            label: 'كلمة المرور الجديدة',
                            controller: controller.newPasswordController,
                            icon: Icons.lock_open_rounded,
                            isPassword: true,
                          ),
                          const SizedBox(height: 15),
                          _buildModernTextField(
                            label: 'تأكيد كلمة المرور الجديدة',
                            controller: controller.confirmPasswordController,
                            icon: Icons.verified_user_outlined,
                            isPassword: true,
                          ),
                        ],
                      ),
                    ).animate().fadeIn(delay: 400.ms).slideY(begin: 0.1, end: 0),

                    const SizedBox(height: 35),

                    // Save Button
                    _buildSaveButton().animate().fadeIn(delay: 600.ms).scale(begin: const Offset(0.9, 0.9)),
                    
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPremiumSection({required String title, required IconData icon, required Widget child}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(right: 18, bottom: 12),
          child: Row(
            children: [
              Icon(icon, size: 20, color: AppColor.color_primary),
              const SizedBox(width: 10),
              Text(
                title,
                style: const TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF2D3142),
                ),
              ),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF1E293B) : Colors.white,
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 20,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: child,
        ),
      ],
    );
  }

  Widget _buildModernTextField({
    required String label,
    required TextEditingController controller,
    required IconData icon,
    bool enabled = true,
    bool isPassword = false,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(right: 4, bottom: 6),
          child: Text(
            label,
            style: TextStyle(
              fontFamily: 'Cairo',
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: Colors.grey.shade600,
            ),
          ),
        ),
        TextField(
          controller: controller,
          enabled: enabled,
          obscureText: isPassword,
          style: Theme.of(context).textTheme.bodyMedium,
          decoration: InputDecoration(
            prefixIcon: Icon(icon, color: enabled ? AppColor.primary : Colors.grey, size: 20),
            filled: true,
            fillColor: enabled ? (Theme.of(context).brightness == Brightness.dark ? Colors.white.withOpacity(0.02) : Colors.grey.shade50) : (Theme.of(context).brightness == Brightness.dark ? Colors.white.withOpacity(0.05) : const Color(0xFFF2F2F2)),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(15),
              borderSide: BorderSide.none,
            ),
            contentPadding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
          ),
        ),
      ],
    );
  }

  Widget _buildSaveButton() {
    return Container(
      width: double.infinity,
      height: 58,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColor.color_primary, AppColor.color_primary.withOpacity(0.8)],
        ),
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: AppColor.color_primary.withOpacity(0.3),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          shadowColor: Colors.transparent,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        ),
        onPressed: controller.loading.value ? null : controller.submitChanges,
        child: controller.loading.value
            ? const SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.check_circle_outline, color: Colors.white),
                  const SizedBox(width: 12),
                  const Text(
                    'تحديث الملف الشخصي',
                    style: TextStyle(
                      color: Colors.white,
                      fontFamily: 'Cairo',
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}
