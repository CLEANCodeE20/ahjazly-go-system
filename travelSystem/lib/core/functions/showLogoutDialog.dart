import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../features/auth/controller/AuthService.dart';
import '../constants/Color.dart';
import '../constants/dimensions.dart';

void showLogoutDialog(BuildContext context) {
  Get.dialog(
    Center(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 30),
        padding: const EdgeInsets.all(25),
        decoration: BoxDecoration(
          color: AppColor.surface,
          borderRadius: BorderRadius.circular(AppDimensions.radiusXXLarge),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 20,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Material(
          color: Colors.transparent,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Icon with soft background
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.red.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.logout_rounded,
                  color: Colors.redAccent,
                  size: 40,
                ),
              ).animate().scale(duration: 400.ms, curve: Curves.easeOutBack),
              
              const SizedBox(height: 20),
              
              // Title
              Text(
                "تأكيد تسجيل الخروج".tr,
                style: const TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: AppColor.textPrimary,
                ),
              ),
              
              const SizedBox(height: 12),
              
              // Message
              Text(
                "هل أنت متأكد أنك تريد تسجيل الخروج من حسابك؟".tr,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 14,
                  color: Colors.grey.shade600,
                  height: 1.5,
                ),
              ),
              
              const SizedBox(height: 30),
              
              // Buttons
              Row(
                children: [
                  // Cancel Button (Primary)
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () => Get.back(),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColor.color_primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 15),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(15),
                        ),
                        elevation: 0,
                      ),
                      child: Text(
                        "إلغاء".tr,
                        style: const TextStyle(
                          fontFamily: 'Cairo',
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                  
                  const SizedBox(width: 12),
                  
                  // Logout Button (Outline/Subtle)
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () async {
                        Get.back(); // Close dialog
                        await Get.find<AuthService>().logout();
                      },
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 15),
                        side: BorderSide(color: Colors.grey.shade300),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(15),
                        ),
                      ),
                      child: Text(
                        "خروج".tr,
                        style: TextStyle(
                          fontFamily: 'Cairo',
                          color: Colors.redAccent,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ).animate().fadeIn(duration: 300.ms).scale(begin: const Offset(0.9, 0.9)),
    ),
    barrierDismissible: true,
  );
}
