import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart' as intl; 

import '../../../../core/constants/Color.dart';
import '../../../../core/constants/dimensions.dart';
import '../../../../core/services/notification_service.dart';
import '../../controller/notification_controller.dart';
// import 'homepage.dart'; // No longer needed if we show lists

class notification extends StatelessWidget {
  const notification({super.key});

  @override
  Widget build(BuildContext context) {
    // Inject controller
    final controller = Get.put(NotificationPageController());

    return DefaultTabController(
      length: 4,
      initialIndex: 0,
      child: Scaffold(
        appBar: _buildAppBar(context, controller),
        body: TabBarView(
          children: [
            // Tab 1: All
            _buildNotificationList(controller, (c) => c.allNotifications),
            
            // Tab 2: Reservations
            _buildNotificationList(controller, (c) => c.bookingNotifications),
            
            // Tab 3: Updates ('48'.tr)
            _buildNotificationList(controller, (c) => c.updateNotifications),

            // Tab 4: Offers ('47'.tr)
             _buildNotificationList(controller, (c) => c.offerNotifications),
          ],
        ),
      ),
    );
  }

  AppBar _buildAppBar(BuildContext context, NotificationPageController controller) {
    return AppBar(
      elevation: 0,
      centerTitle: true,
      title: Text("44".tr, style: TextStyle(color: AppColor.color_primary, fontSize: AppDimensions.fontSizeXXLarge, fontWeight: FontWeight.bold)),
      backgroundColor: AppColor.primaryLighter,
      leading: IconButton(
        onPressed: () => Navigator.pop(context),
        icon: Icon(Icons.arrow_back_rounded, color: AppColor.color_primary),
      ),
      actions: [
        IconButton(
          icon: Icon(Icons.done_all, color: AppColor.color_primary),
          tooltip: 'تحديد الكل كمقروء',
          onPressed: controller.markAllRead,
        )
      ],
      bottom: TabBar(
          indicator: BoxDecoration(
            borderRadius: BorderRadius.circular(AppDimensions.radiusLarge),
            color: AppColor.color_primary,
          ),
          unselectedLabelColor: AppColor.color_primary,
          labelColor: AppColor.color_secondary,
          labelStyle: const TextStyle(fontSize: AppDimensions.fontSizeLarge, fontWeight: FontWeight.bold),
          indicatorColor: AppColor.color_primary,
          indicatorSize: TabBarIndicatorSize.tab,
          tabs: [
            Tab(text: '45'.tr), // All
            Tab(text: '46'.tr), // Reservation
            Tab(text: '48'.tr), // Updates (moved to match logical order if needed or keep existing)
            Tab(text: '47'.tr), // Offers
          ]),
    );
  }

  Widget _buildNotificationList(
      NotificationPageController controller,
      List<NotificationModel> Function(NotificationPageController) listSelector) {
    return Obx(() {
      final list = listSelector(controller);

      if (list.isEmpty) {
        return Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.notifications_off_outlined, size: 80, color: Colors.grey.shade300),
              const SizedBox(height: 16),
              Text(
                'لا توجد إشعارات حالياً',
                style: TextStyle(color: Colors.grey.shade500, fontSize: 16),
              ),
            ],
          ),
        );
      }

      return RefreshIndicator(
        onRefresh: controller.refreshNotifications,
        child: ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: list.length,
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (context, index) {
            final item = list[index];
            return _NotificationItem(model: item, onTap: () => controller.markAsRead(item.id))
                .animate()
                .fadeIn(delay: (index * 100).ms)
                .slideX(begin: 0.1, end: 0);
          },
        ),
      );
    });
  }
}

class _NotificationItem extends StatelessWidget {
  final NotificationModel model;
  final VoidCallback onTap;

  const _NotificationItem({required this.model, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: model.isRead ? Colors.white : AppColor.primaryLighter.withOpacity(0.3),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey.shade200),
          boxShadow: [
            BoxShadow(
              color: Colors.grey.withOpacity(0.05),
              blurRadius: 4,
              offset: const Offset(0, 2),
            )
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Icon based on typ
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: _getIconColor(model.type).withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(_getIcon(model.type), color: _getIconColor(model.type), size: 24),
            ),
            const SizedBox(width: 12),
            
            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                   Row(
                     mainAxisAlignment: MainAxisAlignment.spaceBetween,
                     children: [
                       Text(
                         model.title,
                         style: TextStyle(
                           fontWeight: model.isRead ? FontWeight.w600 : FontWeight.bold,
                           fontSize: 15,
                           color: Colors.black87,
                         ),
                       ),
                       if (!model.isRead)
                         Container(width: 8, height: 8, decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle))
                     ],
                   ),
                   const SizedBox(height: 4),
                   Text(
                     model.body,
                     style: TextStyle(color: Colors.grey.shade600, fontSize: 13, height: 1.3),
                     maxLines: 3,
                     overflow: TextOverflow.ellipsis,
                   ),
                   const SizedBox(height: 8),
                   Text(
                     intl.DateFormat('yyyy-MM-dd hh:mm a').format(model.timestamp),
                     style: TextStyle(color: Colors.grey.shade400, fontSize: 11),
                   ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _getIconColor(String type) {
    switch (type) {
      case 'booking': return AppColor.color_primary;
      case 'payment': return Colors.green;
      case 'promotion': return Colors.orange;
      case 'system': return Colors.blueGrey;
      default: return AppColor.color_primary;
    }
  }

  IconData _getIcon(String type) {
    switch (type) {
      case 'booking': return Icons.confirmation_number_outlined;
      case 'payment': return Icons.payment;
      case 'promotion': return Icons.verified_outlined;
      case 'system': return Icons.info_outline;
      default: return Icons.notifications_none;
    }
  }
}
