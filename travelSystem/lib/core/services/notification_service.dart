import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../utils/error_handler.dart';
import '../../features/auth/controller/AuthService.dart';

// نموذج إشعار محدث ليتطابق مع قاعدة البيانات
class NotificationModel {
  final int id;
  final String title;
  final String body;
  final String type; // booking, payment, trip, system, promotion
  final DateTime timestamp;
  final int? relatedBookingId;
  bool isRead;

  NotificationModel({
    required this.id,
    required this.title,
    required this.body,
    required this.type,
    required this.timestamp,
    this.relatedBookingId,
    this.isRead = false,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['notification_id'] ?? 0,
      title: json['type'] == 'booking' ? 'تحديث حجز' 
           : json['type'] == 'payment' ? 'تحديث دفع'
           : json['type'] == 'promotion' ? 'عرض جديد'
           : 'إشعار إداري', // يمكن تحسين العناوين لاحقاً
      body: json['message'] ?? '',
      type: json['type'] ?? 'system',
      timestamp: DateTime.parse(json['sent_at'] ?? DateTime.now().toIso8601String()),
      relatedBookingId: json['related_booking_id'],
      isRead: json['is_read'] ?? false,
    );
  }
}

class NotificationService extends GetxService {
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final SupabaseClient _supabase = Supabase.instance.client;
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();
  
  // قناة الإشعارات عالية الأهمية
  static const AndroidNotificationChannel channel = AndroidNotificationChannel(
    'high_importance_channel', // id
    'High Importance Notifications', // title
    description: 'This channel is used for important notifications.', // description
    importance: Importance.max,
  );

  // الوصول لخدمة المصادقة لمعرفة المستخدم الحالي
  AuthService? _authService;

  // قائمة الإشعارات
  final notifications = <NotificationModel>[].obs;
  
  // عداد غير المقروء
  int get unreadCount => notifications.where((n) => !n.isRead).length;

  final hasPermission = false.obs;

  Future<NotificationService> init() async {
    try {
      _authService = Get.find<AuthService>();
      
      // تهيئة الإشعارات المحلية للقنوات
      await _setupLocalNotifications();
      
      // 1. إعداد FCM
      await _setupFCM();
      
      // 2. جلب الإشعارات القديمة من Supabase
      if (_authService?.isAuthenticated ?? false) {
        await fetchNotifications();
        _subscribeToRealtime();
      }
      
      // الاستماع لتغير حالة الدخول
      if (_authService != null) {
        ever(_authService!.userStatus, (status) {
          if (status == UserStatus.authenticated) {
            fetchNotifications();
            _subscribeToRealtime();
            _updateFcmToken();
          } else {
            notifications.clear();
          }
        });
      }

    } catch (e) {
      print('Error initializing notifications: $e');
    }
    return this;
  }

  Future<void> _setupLocalNotifications() async {
    // إنشاء قناة أندرويد
    await _localNotifications
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);

    // تهيئة الإشعارات المحلية
    const AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings('ic_notification');
    
    const InitializationSettings initializationSettings = InitializationSettings(
      android: initializationSettingsAndroid,
      iOS: DarwinInitializationSettings(),
    );

    await _localNotifications.initialize(initializationSettings);
  }
  
  Future<void> _setupFCM() async {
     final settings = await _messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );

      hasPermission.value = settings.authorizationStatus == AuthorizationStatus.authorized;
      print('🔔 FCM Permission Status: ${settings.authorizationStatus}');
      
      if (hasPermission.value) {
        // Foreground
        FirebaseMessaging.onMessage.listen((RemoteMessage message) {
          print('📬 Foreground message received: ${message.messageId}');
          print('📦 Message Data: ${message.data}');
          print('📋 Message Notification: ${message.notification?.title} - ${message.notification?.body}');
          
          RemoteNotification? notification = message.notification;
          AndroidNotification? android = message.notification?.android;

          if (notification != null) {
            // إظهار تنبيه محلي فوراً لضمان ظهور الـ Popup في الواجهة
            print('🚀 Showing local notification...');
            _localNotifications.show(
              notification.hashCode,
              notification.title,
              notification.body,
              NotificationDetails(
                android: AndroidNotificationDetails(
                  channel.id,
                  channel.name,
                  channelDescription: channel.description,
                  icon: android?.smallIcon ?? 'ic_notification',
                  importance: Importance.max,
                  priority: Priority.high,
                  ticker: 'ticker',
                ),
              ),
            );

            // تحديث القائمة
            fetchNotifications(); 
          } else {
             print('⚠️ Received message without notification body');
          }
        });
        
        // Background Open
        FirebaseMessaging.onMessageOpenedApp.listen((message) {
          print('🖱️ Notification clicked and app opened: ${message.messageId}');
          _handleNotificationClick(message);
        });
        
        _updateFcmToken();
      } else {
        print('❌ FCM Permission Denied!');
      }
  }
  Future<void> _updateFcmToken() async {
    final userId = _authService?.userId;
    if (userId == null) return;

    try {
      final token = await _messaging.getToken();
      if (token == null || token.isEmpty) return;

      // استخدام RPC لتجاوز قيود RLS عند تبديل المستخدمين على نفس الجهاز
      await _supabase.rpc('register_device_token', params: {
        'p_user_id': userId,
        'p_fcm_token': token,
        'p_device_type': GetPlatform.isIOS ? 'ios' : 'android',
      });
      
      print('✅ [SUCCESS] FCM Token Registered via RPC');
    } catch (e) {
      print('❌ [ERROR] FCM Token Registration Error: $e');
    }
  }



  // --- Supabase Operations ---

  /// جلب الإشعارات من قاعدة البيانات
  Future<void> fetchNotifications() async {
    final userId = _authService?.userId;
    if (userId == null) return;

    try {
      final response = await _supabase
          .from('notifications')
          .select()
          .eq('auth_id', userId) // Updated to auth_id
          .order('sent_at', ascending: false)
          .limit(50); // آخر 50 إشعار

      final List<dynamic> data = response;
      notifications.assignAll(data.map((json) => NotificationModel.fromJson(json)).toList());
    } catch (e) {
        print('Error fetching notifications: $e');
    }
  }

  /// الاستماع الفوري للجدول
  void _subscribeToRealtime() {
    final userId = _authService?.userId;
    if (userId == null) return;

    _supabase
        .channel('public:notifications')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'notifications',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'auth_id', // Changed from user_id
            value: userId,
          ),
          callback: (payload) {
            final newNotification = NotificationModel.fromJson(payload.newRecord);
            
            // Check settings before adding to list/alerting
            if (_shouldShowNotification(newNotification.type)) {
               notifications.insert(0, newNotification);
            }
          },
        )
        .subscribe();
  }

  bool _shouldShowNotification(String? type) {
    print('Checking setting for type: $type');
    final box = GetStorage();

    // 1. Global Check
    if (box.read('global_notif') == false) return false;

    // 2. Type Check
    if (type == 'booking') {
       return box.read('notif_booking_updates') ?? true;
    } else if (type == 'promotion') {
       return box.read('notif_offers') ?? true;
    } 

    return true; // Default allow
  }

  /// تعليم كـ مقروء
  Future<void> markAsRead(int id) async {
    // تحديث محلي سريع
    final index = notifications.indexWhere((n) => n.id == id);
    if (index != -1) {
      notifications[index].isRead = true;
      notifications.refresh(); // لتحديث الواجهة
    }

    // تحديث السيرفر
    try {
      await _supabase.from('notifications').update({'is_read': true}).eq('notification_id', id);
    } catch(e) {
      print('Error marking as read: $e');
    }
  }
  
  /// تعليم الكل كـ مقروء
  Future<void> markAllAsRead() async {
    final userId = _authService?.userId;
    if (userId == null) return;
    
    notifications.forEach((n) => n.isRead = true);
    notifications.refresh();

    try {
      await _supabase.from('notifications')
          .update({'is_read': true})
          .eq('auth_id', userId) // Updated to auth_id
          .eq('is_read', false);
    } catch(e) {
      print('Error mark all read: $e');
    }
  }

  void _handleNotificationClick(RemoteMessage message) {
    // منطق التوجيه مستقبلاً
  }
}
