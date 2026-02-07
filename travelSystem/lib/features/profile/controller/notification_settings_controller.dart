import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../domain/usecases/get_notification_settings_usecase.dart';
import '../domain/usecases/update_notification_settings_usecase.dart';
import '../domain/entities/notification_settings_entity.dart';
import '../../auth/controller/AuthService.dart';
import '../data/models/notification_option.dart';

class NotificationSettingsController extends GetxController {
  final AuthService _authService = Get.find();
  final GetNotificationSettingsUseCase _getSettingsUseCase = Get.find();
  final UpdateNotificationSettingsUseCase _updateSettingsUseCase = Get.find();
  
  // قائمة الخيارات المنظمة
  late List<NotificationOption> options;

  // حالة كل خيار (تشغيل/إيقاف)
  final Map<String, RxBool> toggles = {};
  final isGlobalEnabled = true.obs;
  final loading = false.obs;
  
  NotificationSettingsEntity? currentSettings;
  late String userId;

  @override
  void onInit() {
    super.onInit();
    
    final uid = _authService.userId;
    if (uid != null) {
      userId = uid.toString();
      _initializeOptions();
      _loadSettings();
    }
  }

  void _initializeOptions() {
    options = [
      // تـنبـيهات الـرحـلات
      NotificationOption(
        id: 'booking_updates',
        title: '72', // تحديثات الحجوزات
        subtitle: '73', // تنبيهات حالة الحجز
        icon: Icons.bus_alert_outlined,
        category: 'تنبيهات الرحلات',
        color: Colors.blue,
      ),
      NotificationOption(
        id: 'trip_reminders',
        title: '125', // تذكير بالرحلات
        subtitle: '126', // إشعارات قبل الرحلة
        icon: Icons.alarm_outlined,
        category: 'تنبيهات الرحلات',
        color: Colors.cyan,
      ),
      NotificationOption(
        id: 'payment_alerts',
        title: '127', // تنبيهات الدفع
        subtitle: '128', // إشعارات المدفوعات
        icon: Icons.payment_outlined,
        category: 'تنبيهات الرحلات',
        color: Colors.green,
      ),
      
      // العروض والخصومات
      NotificationOption(
        id: 'promotions',
        title: '129', // عروض حصرية
        subtitle: '130', // اكتشف أفضل الخصومات
        icon: Icons.local_offer_outlined,
        category: 'العروض الترويجية',
        color: Colors.orange,
      ),
      
      // قنوات التواصل
      NotificationOption(
        id: 'push_enabled',
        title: '131', // Push
        subtitle: '132', // Instant alerts
        icon: Icons.notifications_active_outlined,
        category: 'قنوات التواصل',
        color: Colors.purple,
      ),
      NotificationOption(
        id: 'email_enabled',
        title: '133', // Email
        subtitle: '134', // Email notifications
        icon: Icons.email_outlined,
        category: 'قنوات التواصل',
        color: Colors.blue,
      ),
      NotificationOption(
        id: 'sms_enabled',
        title: '135', // SMS
        subtitle: '136', // Phone alerts
        icon: Icons.sms_outlined,
        category: 'قنوات التواصل',
        color: Colors.green,
      ),
    ];

    // Initialize toggles
    for (final opt in options) {
      toggles[opt.id] = RxBool(true);
    }
  }

  Future<void> _loadSettings() async {
    loading.value = true;
    final result = await _getSettingsUseCase(userId);
    
    result.fold(
      (failure) {
        // Use default settings
        isGlobalEnabled.value = true;
      },
      (settings) {
        currentSettings = settings;
        _applySettings(settings);
      },
    );
    loading.value = false;
  }

  void _applySettings(NotificationSettingsEntity settings) {
    toggles['push_enabled']?.value = settings.pushEnabled;
    toggles['email_enabled']?.value = settings.emailEnabled;
    toggles['sms_enabled']?.value = settings.smsEnabled;
    toggles['trip_reminders']?.value = settings.tripReminders;
    toggles['promotions']?.value = settings.promotions;
    toggles['booking_updates']?.value = settings.bookingUpdates;
    toggles['payment_alerts']?.value = settings.paymentAlerts;
    
    isGlobalEnabled.value = settings.pushEnabled || settings.emailEnabled || settings.smsEnabled;
  }

  Future<void> toggleOption(String id, bool value) async {
    toggles[id]?.value = value;
    await _saveSettings();
  }

  Future<void> toggleGlobal(bool value) async {
    isGlobalEnabled.value = value;
    
    // If disabling globally, disable all channels
    if (!value) {
      toggles['push_enabled']?.value = false;
      toggles['email_enabled']?.value = false;
      toggles['sms_enabled']?.value = false;
    } else {
      // If enabling, enable at least push notifications
      toggles['push_enabled']?.value = true;
    }
    
    await _saveSettings();
  }

  Future<void> _saveSettings() async {
    if (currentSettings == null) return;
    
    final updatedSettings = currentSettings!.copyWith(
      pushEnabled: toggles['push_enabled']?.value ?? true,
      emailEnabled: toggles['email_enabled']?.value ?? true,
      smsEnabled: toggles['sms_enabled']?.value ?? false,
      tripReminders: toggles['trip_reminders']?.value ?? true,
      promotions: toggles['promotions']?.value ?? true,
      bookingUpdates: toggles['booking_updates']?.value ?? true,
      paymentAlerts: toggles['payment_alerts']?.value ?? true,
      updatedAt: DateTime.now(),
    );

    final result = await _updateSettingsUseCase(updatedSettings);
    
    result.fold(
      (failure) {
        Get.snackbar('خطأ', 'فشل في حفظ الإعدادات');
      },
      (settings) {
        currentSettings = settings;
        Get.snackbar('نجاح', 'تم حفظ الإعدادات بنجاح');
      },
    );
  }
}
