import 'package:get/get.dart';
import '../../../../core/services/notification_service.dart';

class NotificationPageController extends GetxController {
  final NotificationService _service = Get.find<NotificationService>();

  // --- Getters for Filtered Lists ---

  List<NotificationModel> get allNotifications => _service.notifications;

  List<NotificationModel> get bookingNotifications => _service.notifications
      .where((n) => n.type == 'booking')
      .toList();

  List<NotificationModel> get offerNotifications => _service.notifications
      .where((n) => n.type == 'promotion')
      .toList();

  List<NotificationModel> get updateNotifications => _service.notifications
      .where((n) => n.type != 'booking' && n.type != 'promotion')
      .toList();


  // --- Actions ---

  Future<void> markAsRead(int id) async {
    await _service.markAsRead(id);
  }

  Future<void> markAllRead() async {
    await _service.markAllAsRead();
  }
  
  Future<void> refreshNotifications() async {
    await _service.fetchNotifications();
  }
}
