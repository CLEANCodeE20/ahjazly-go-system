import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../services/system_settings_service.dart';

class MaintenanceBlockadeScreen extends StatelessWidget {
  const MaintenanceBlockadeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final settings = Get.find<SystemSettingsService>();

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 30),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Illustration or Icon
              Container(
                padding: const EdgeInsets.all(30),
                decoration: BoxDecoration(
                  color: Colors.amber.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.construction_rounded,
                  size: 80,
                  color: Colors.amber,
                ),
              ),
              const SizedBox(height: 40),
              
              const Text(
                'النظام تحت الصيانة',
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 15),
              
              Text(
                'نحن نقوم حالياً ببعض التحسينات لخدمتكم بشكل أفضل. سنعود قريباً جداً، شكراً لصبركم.',
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 14,
                  color: Colors.grey.shade600,
                  height: 1.5,
                ),
                textAlign: TextAlign.center,
              ),
              
              const SizedBox(height: 40),
              
              // Retry Button
              Obx(() => ElevatedButton(
                onPressed: settings.isLoading.value 
                  ? null 
                  : () => settings.fetchSettings(),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF9B69B4),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 15),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 0,
                ),
                child: settings.isLoading.value
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Text(
                      'إعادة المحاولة',
                      style: TextStyle(
                        fontFamily: 'Cairo',
                        fontWeight: FontWeight.bold,
                      ),
                    ),
              )),
              
              const SizedBox(height: 20),
              Text(
                'System under scheduled maintenance',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey.shade400,
                  fontStyle: FontStyle.italic,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
