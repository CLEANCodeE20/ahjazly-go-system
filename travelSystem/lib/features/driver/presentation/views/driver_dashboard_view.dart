import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:travelsystem/features/wallet/presentation/views/wallet_view.dart';
import '../../../../core/constants/nameRoute.dart';
import '../../controller/driver_dashboard_controller.dart';
import '../widgets/next_trip_card.dart';
import '../widgets/stats_card.dart';
import '../widgets/trip_list_item.dart';
import '../../../../core/constants/Color.dart';
import '../../../../core/constants/dimensions.dart';


class DriverDashboardView extends StatelessWidget {
  const DriverDashboardView({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(DriverDashboardController());

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FD), // Soft background
      body: SafeArea(
        child: Obx(() {
          if (controller.isLoading.value) {
            return const Center(child: CircularProgressIndicator());
          }

          return RefreshIndicator(
            onRefresh: controller.refresh,
            child: CustomScrollView(
              physics: const BouncingScrollPhysics(),
              slivers: [
                // 1. Custom Header & Status
                SliverToBoxAdapter(
                  child: _buildHeaderSection(context, controller),
                ),

                // 2. Stats Overview
                SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  sliver: SliverToBoxAdapter(
                    child: _buildStatsGrid(controller),
                  ),
                ),

                // 3. Active/Next Trip (Prominent)
                if (controller.nextTrip != null)
                  SliverPadding(
                    padding: const EdgeInsets.all(16),
                    sliver: SliverToBoxAdapter(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'الرحلة الحالية',
                            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, fontFamily: 'Cairo'),
                          ),
                          const SizedBox(height: 12),
                          NextTripCard(trip: controller.nextTrip!)
                              .animate()
                              .fadeIn(duration: 500.ms)
                              .slideY(begin: 0.1, end: 0),
                        ],
                      ),
                    ),
                  ),

                // 4. Today's Schedule
                SliverPadding(
                  padding: const EdgeInsets.all(16),
                  sliver: SliverToBoxAdapter(
                    child: _buildTodayTripsSection(controller),
                  ),
                ),

                // 5. Upcoming
                if (controller.upcomingTrips.isNotEmpty)
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 30),
                    sliver: SliverToBoxAdapter(
                      child: _buildUpcomingTripsSection(controller),
                    ),
                  ),
              ],
            ),
          );
        }),
      ),
    );
  }

  Widget _buildHeaderSection(BuildContext context, DriverDashboardController controller) {
    final now = DateTime.now();
    final greeting = now.hour < 12 ? 'صباح الخير' : 'مساء الخير';

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(30),
          bottomRight: Radius.circular(30),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        children: [
          // Top Row: Avatar & Notifications
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  GestureDetector(
                    onTap: () => Get.toNamed(AppRoute.DriverProfile),
                    child: Container(
                      padding: const EdgeInsets.all(2),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: AppColor.color_primary, width: 2),
                      ),
                      child: const CircleAvatar(
                        radius: 24,
                        backgroundImage: AssetImage('assets/images/driver_avatar_placeholder.png'), // Replace with actual image
                        backgroundColor: Colors.grey,
                        child: Icon(Icons.person, color: Colors.white),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        greeting,
                        style: const TextStyle(fontSize: 14, color: Colors.grey, fontFamily: 'Cairo'),
                      ),
                      const Text(
                        'كابتن محمد', // Replace with dynamic name
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, fontFamily: 'Cairo'),
                      ),
                    ],
                  ),
                ],
              ),
              Container(
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(12),
                ),
                child: IconButton(
                  icon: const Icon(Icons.notifications_none_rounded),
                  onPressed: () {}, // TODO: Notifications
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Status Toggle (Premium Look)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: controller.isOnline.value ? const Color(0xFFE8F5E9) : const Color(0xFFFFEBEE),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: controller.isOnline.value ? Colors.green.withOpacity(0.3) : Colors.red.withOpacity(0.3),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: controller.isOnline.value ? Colors.green : Colors.red,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        controller.isOnline.value ? Icons.power_settings_new : Icons.power_off,
                        color: Colors.white,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          controller.isOnline.value ? 'أنت متصل الآن' : 'أنت غير متصل',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: controller.isOnline.value ? Colors.green[800] : Colors.red[800],
                            fontFamily: 'Cairo',
                          ),
                        ),
                        Text(
                          controller.isOnline.value ? 'جاهز لاستقبال الرحلات' : 'لن تستقبل أي رحلات جديدة',
                          style: TextStyle(
                            fontSize: 12,
                            color: controller.isOnline.value ? Colors.green[600] : Colors.red[600],
                            fontFamily: 'Cairo',
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                Switch.adaptive(
                  value: controller.isOnline.value,
                  onChanged: (val) => controller.toggleStatus(),
                  activeColor: Colors.green,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsGrid(DriverDashboardController controller) {
    return Row(
      children: [
        Expanded(
          child: _buildStatItem(
            'رحلات اليوم',
            controller.todayTrips.length.toString(),
            Icons.directions_car_filled_rounded,
            Colors.blue,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildStatItem(
            'الركاب',
            controller.totalPassengers.value.toString(),
            Icons.people_alt_rounded,
            Colors.orange,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Obx(() => _buildStatItem(
            'الأرباح',
                        '${NumberFormat('#,##0.00', 'ar_SA').format(controller.totalEarnings.value)} ر.س',
            Icons.account_balance_wallet_rounded,
            Colors.green,
          )),
        ),
      ],
    );
  }

  Widget _buildStatItem(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, fontFamily: 'Cairo'),
          ),
          Text(
            title,
            style: const TextStyle(fontSize: 12, color: Colors.grey, fontFamily: 'Cairo'),
          ),
        ],
      ),
    );
  }

  Widget _buildTodayTripsSection(DriverDashboardController controller) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'جدول اليوم',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, fontFamily: 'Cairo'),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: AppColor.color_primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                '${controller.todayTrips.length} رحلات',
                style:  TextStyle(color: AppColor.color_primary, fontWeight: FontWeight.bold, fontSize: 12),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        if (controller.todayTrips.isEmpty)
          _buildEmptyState('لا توجد رحلات مجدولة لليوم', Icons.calendar_today_rounded)
        else
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: controller.todayTrips.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final trip = controller.todayTrips[index];
              return TripListItem(
                trip: trip,
                onTap: () => Get.toNamed('/driver/trip-details', arguments: trip),
              ).animate().fadeIn(delay: (100 * index).ms).slideX();
            },
          ),
      ],
    );
  }

  Widget _buildUpcomingTripsSection(DriverDashboardController controller) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'الرحلات القادمة',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, fontFamily: 'Cairo'),
        ),
        const SizedBox(height: 16),
        ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: controller.upcomingTrips.take(3).length,
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (context, index) {
            final trip = controller.upcomingTrips[index];
            return TripListItem(
              trip: trip,
              isUpcoming: true,
              onTap: () => Get.toNamed('/driver/trip-details', arguments: trip),
            ).animate().fadeIn(delay: (100 * index).ms).slideX();
          },
        ),
      ],
    );
  }

  Widget _buildEmptyState(String message, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(30),
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.withOpacity(0.2)),
      ),
      child: Column(
        children: [
          Icon(icon, size: 48, color: Colors.grey[300]),
          const SizedBox(height: 12),
          Text(
            message,
            style: TextStyle(color: Colors.grey[500], fontFamily: 'Cairo'),
          ),
        ],
      ),
    );
  }
}
