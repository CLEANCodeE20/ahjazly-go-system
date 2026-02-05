import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../widgets/rate_trip_button.dart';
import '../widgets/trip_status_widgets.dart';

import '../../../../core/constants/Color.dart';
import '../../../../core/constants/dimensions.dart';
import '../../../../core/classes/StatusRequest.dart';
import '../../../booking/controller/user_bookings_controller.dart';
import '../../../booking/presentation/widgets/booking_cards/user_booking_card.dart';

class Reservations extends StatelessWidget {
  const Reservations({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.find<UserBookingsController>();

    return DefaultTabController(
      length: 4,
      initialIndex: 0,
      child: Scaffold(
        backgroundColor: Theme.of(context).scaffoldBackgroundColor,
        appBar: AppBar(
          backgroundColor: Theme.of(context).appBarTheme.backgroundColor,
          elevation: 0.5,
          title: Text(
            'حجوزاتي'.tr,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontSize: 18,
                ),
          ),
          centerTitle: true,
          actions: [
            Obx(() => IconButton(
                  onPressed: controller.isLoading.value ? null : () => controller.fetchBookings(),
                  icon: controller.isLoading.value
                      ? SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Theme.of(context).colorScheme.primary),
                        )
                      : Icon(Icons.refresh_rounded, color: Theme.of(context).colorScheme.primary),
                )),
          ],
          bottom: PreferredSize(
            preferredSize: const Size.fromHeight(60),
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF1A1A1F) : const Color(0xFFF0F3FA),
                borderRadius: BorderRadius.circular(15),
              ),
              child: TabBar(
                onTap: (index) {
                  switch (index) {
                    case 0: controller.changeFilter(BookingFilter.Pending); break;
                    case 1: controller.changeFilter(BookingFilter.confirmed); break;
                    case 2: controller.changeFilter(BookingFilter.completed); break;
                    case 3: controller.changeFilter(BookingFilter.cancelled); break;
                  }
                },
                indicatorSize: TabBarIndicatorSize.tab,
                indicator: BoxDecoration(
                  color: Theme.of(context).colorScheme.primary,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: Theme.of(context).colorScheme.primary.withOpacity(0.3),
                      blurRadius: 8,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                unselectedLabelColor: Theme.of(context).textTheme.bodyMedium?.color,
                labelColor: Theme.of(context).colorScheme.onPrimary,
                labelStyle: const TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.bold, fontSize: 12),
                unselectedLabelStyle: const TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.normal, fontSize: 11),
                dividerColor: Colors.transparent,
                tabs: [
                  Tab(text: 'المراجعة'.tr),
                  Tab(text: 'المؤكدة'.tr),
                  Tab(text: 'المكتملة'.tr),
                  Tab(text: 'الملغاة'.tr),
                ],
              ),
            ),
          ),
        ),
        body: Obx(() {
          if (controller.status.value == StatRequst.noInternet) {
            return _buildNoInternet(controller, context);
          }

          if (controller.isLoading.value) {
            return const Center(child: CircularProgressIndicator());
          }

          if (controller.errorMessage.isNotEmpty) {
            return _buildErrorState(controller);
          }

          if (controller.filteredBookings.isEmpty) {
            return _buildEmptyState();
          }

          return RefreshIndicator(
            color: AppColor.color_primary,
            onRefresh: controller.fetchBookings,
            child: ListView.builder(
              padding: const EdgeInsets.all(20),
              physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
              itemCount: controller.filteredBookings.length,
              itemBuilder: (context, index) {
                return UserBookingCard(b: controller.filteredBookings[index]);
              },
            ),
          );
        }),
      ),
    );
  }

  Widget _buildNoInternet(UserBookingsController controller, BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.wifi_off_rounded, size: 80, color: Theme.of(context).colorScheme.outline),
          const SizedBox(height: 20),
          Text('لا يوجد اتصال بالإنترنت', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 10),
          Text('يرجى التحقق من الشبكة وإعادة المحاولة', style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: 30),
          ElevatedButton(
            onPressed: controller.fetchBookings,
            style: ElevatedButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.primary,
              foregroundColor: Theme.of(context).colorScheme.onPrimary,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 12),
            ),
            child: const Text('إعادة المحاولة', style: TextStyle(fontFamily: 'Cairo')),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState(UserBookingsController controller) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.sentiment_dissatisfied_rounded, size: 80, color: Colors.redAccent),
          const SizedBox(height: 20),
          Text(controller.errorMessage.value, textAlign: TextAlign.center, style: const TextStyle(fontFamily: 'Cairo', color: Colors.red)),
          const SizedBox(height: 30),
          TextButton.icon(
            onPressed: controller.fetchBookings,
            icon: const Icon(Icons.refresh),
            label: const Text('حاول مرة أخرى', style: TextStyle(fontFamily: 'Cairo')),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.airplane_ticket_outlined, size: 100, color: Colors.grey.shade200),
          const SizedBox(height: 20),
          Text(
            'لا توجد حجوزات في هذه الفئة'.tr,
            style: const TextStyle(fontFamily: 'Cairo', color: Colors.grey, fontSize: 15),
          ),
        ],
      ),
    );
  }
}
