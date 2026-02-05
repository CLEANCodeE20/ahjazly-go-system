import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:travelsystem/core/constants/Color.dart';
import 'package:travelsystem/core/routes/app_pages.dart';
import 'package:intl/date_symbol_data_local.dart';

// Firebase
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

import 'core/bindings/initial_binding.dart';
import 'core/services/secure_storage_service.dart';
import 'features/auth/controller/AuthService.dart';
import 'core/services/services.dart';
import 'core/localization/Changelocal.dart';
import 'core/localization/transiletion.dart';
import 'core/services/notification_service.dart';
import 'core/services/api_service.dart';
import 'core/services/cache_service.dart';
import 'core/supabase/supabase_service.dart';
import 'features/splash/presentation/screens/splash_screen.dart';
import 'features/supabase_integration/supabase_auth_service.dart';
import 'features/supabase_integration/supabase_support_service.dart';
import 'features/supabase_integration/supabase_feature_service.dart';
import 'features/supabase_integration/city_service.dart';

// NEW: Ultimate Offline Handling
import 'core/services/connectivity_engine.dart';
import 'core/widgets/offline/connectivity_wrapper.dart';
import 'core/theme/app_theme.dart';
import 'core/services/theme_service.dart';
import 'core/di/injection_container.dart';

// هندلر الإشعارات في الخلفية - ضروري لإظهار الإشعارات والتطبيق مغلق
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  await GetStorage.init(); // ضروري لقراءة الإعدادات في عملية منفصلة
  
  final box = GetStorage();
  final String? type = message.data['type'];
  
  // التحقق من الإعدادات قبل العرض
  bool shouldShow = true;
  if (box.read('global_notif') == false) {
    shouldShow = false;
  } else if (type == 'booking' && box.read('notif_booking_updates') == false) {
    shouldShow = false;
  } else if (type == 'promotion' && box.read('notif_offers') == false) {
    shouldShow = false;
  }

  if (shouldShow && message.notification != null) {
    final FlutterLocalNotificationsPlugin localNotifications = FlutterLocalNotificationsPlugin();
    
    const AndroidNotificationChannel channel = AndroidNotificationChannel(
      'high_importance_channel',
      'High Importance Notifications',
      importance: Importance.max,
    );

    await localNotifications
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);

    await localNotifications.show(
      message.notification.hashCode,
      message.notification?.title,
      message.notification?.body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          channel.id,
          channel.name,
          icon: 'ic_notification',
          importance: Importance.max,
          priority: Priority.high,
        ),
      ),
    );
  }
  
  print('📬 Background message processed. Shown: $shouldShow');
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await InjectionContainer.init();

  await initializeDateFormatting('ar', null);

  // ============ خدمات حرجة فقط - تهيئة فورية ============
  
  // Firebase - ضروري للإشعارات
  await Firebase.initializeApp();
  
  // GetStorage - ضروري للتخزين المحلي
  await GetStorage.init();
  
  // Secure Storage - بيانات حساسة
  await Get.putAsync(() => SecureStorageService().init());

  // Supabase - قاعدة البيانات الرئيسية
  await Get.putAsync(() => SupabaseService().init());
  
  // Background message handler لـ Firebase
  FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
  
  // ============ خدمات أساسية - تهيئة فورية ============
  
  // Connectivity Engine (The Ultimate Strategy)
  Get.put(ConnectivityEngine(), permanent: true);
  
  // Cache service - مهم للبحث والبيانات المؤقتة
  await Get.putAsync(() => CacheService().init());
  
  // Locale controller
  Get.put(LocaleController());
  
  // Theme Service
  Get.lazyPut(() => ThemeService());
  
  // API Service - ضروري للطلبات الخارجية والـ Supabase
  Get.put(ApiService());
  
  // ============ خدمات اختيارية - Lazy Loading ============
  
  // Authentication & Core Services (Immediate Put to activate listeners)
  Get.put(SupabaseAuthService(), permanent: true);
  Get.put(AuthService(), permanent: true);
  
  // Notification service
  Get.putAsync(() => NotificationService().init(), permanent: true);

  // Lazy Loaded Services
  Get.lazyPut(() => SupabaseSupportService(), fenix: true);
  Get.lazyPut(() => SupabaseFeatureService(), fenix: true);
  Get.putAsync(() => CityService().init(), permanent: true);

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    final ThemeService themeService = Get.find();
    final LocaleController localeController = Get.find();

    return GetMaterialApp(
      getPages: getPages,
      locale: localeController.appLocale.value,
      fallbackLocale: const Locale('ar'),
      translations: Mytranlaztion(),
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeService.theme,
      home: SplashScreen(),
      initialBinding: InitialBinding(),
      defaultTransition: Transition.rightToLeftWithFade,
      transitionDuration: const Duration(milliseconds: 400),
      // Professional Offline Handling Wrapper
      builder: (context, child) {
        return ConnectivityWrapper(child: child!);
      },
    );
  }
}
