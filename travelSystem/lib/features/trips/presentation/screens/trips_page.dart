import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:shimmer/shimmer.dart';

import '../../../../core/constants/Color.dart';
import '../controllers/trip_controller.dart';
import '../../../../core/constants/dimensions.dart';
import '../widgets/enhanced_trip_card.dart';
import 'trip_ratings_page.dart';
import '../../domain/entities/trip_entity.dart';
import '../../../../shared/widgets/bus_trip_card.dart';
import '../../../../shared/widgets/filter_sheet.dart';

class TripsPage extends StatelessWidget {
  const TripsPage({super.key});

  @override
  Widget build(BuildContext context) {
    // استقبال البيانات من صفحة البحث
    final dynamic receivedArgs = Get.arguments;
    List<TripEntity> trips = [];

    if (receivedArgs is List<TripEntity>) {
       trips = receivedArgs;
    } else if (receivedArgs is TripEntity) {
      trips = [receivedArgs];
    }

    final TripController controller = Get.find<TripController>();


    if (controller.trips.isEmpty && trips.isNotEmpty) {
      controller.setTrips(trips);
    }

    return Scaffold(
      appBar: AppBar(
        title: Text('60'.tr, style: const TextStyle(fontWeight: FontWeight.bold)),
        centerTitle: true,
        backgroundColor: Theme.of(context).appBarTheme.backgroundColor,
        foregroundColor: Theme.of(context).appBarTheme.foregroundColor,
      ),
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(AppDimensions.paddingMedium),
            child: Row(
              children: [
                ElevatedButton.icon(
                  onPressed: () {
                    showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
                      shape: const RoundedRectangleBorder(
                        borderRadius: BorderRadius.vertical(
                          top: Radius.circular(AppDimensions.radiusXXLarge),
                        ),
                      ),
                      builder: (context) => FilterSheet(controller: controller),
                    );
                  },
                  icon: Icon(Icons.filter_alt, color: Theme.of(context).colorScheme.onPrimary),
                  label: Text('61'.tr,
                      style: TextStyle(color: Theme.of(context).colorScheme.onPrimary)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Theme.of(context).colorScheme.primary,
                    elevation: 1,
                    side: BorderSide(color: Theme.of(context).colorScheme.primary),
                  ),
                ),
                const SizedBox(width: 14),
                Obx(
                      () => Text(
                    '(${controller.filteredTrips.length}) رحلة متاحة',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: Obx(() {
              if (controller.loading.value) {
                // هنا Shimmer بدل الـ CircularProgressIndicator
                return _buildTripsShimmer(context);
              }

              if (controller.filteredTrips.isEmpty) {
                return const Center(
                  child: Text('لا توجد رحلات مطابقة للمعايير'),
                );
              }

              return ListView.builder(
                itemCount: controller.filteredTrips.length,
                itemBuilder: (context, index) => BusTripCard(
                  trip: controller.filteredTrips[index],
                ).animate().fadeIn(delay: (index * 100).ms).slideY(begin: 0.1, end: 0),
              );
            }),
          ),
        ],
      ),
    );
  }

  // سكليتون Shimmer لقائمة الرحلات
  Widget _buildTripsShimmer(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return ListView.builder(
      padding: const EdgeInsets.symmetric(
        horizontal: AppDimensions.paddingMedium,
        vertical: 8,
      ),
      itemCount: 5,
      itemBuilder: (context, index) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Shimmer.fromColors(
            baseColor: isDark ? Colors.grey.shade800 : Colors.grey.shade300,
            highlightColor: isDark ? Colors.grey.shade700 : Colors.grey.shade100,
            period: const Duration(milliseconds: 1200),
            child: Container(
              height: 110,
              decoration: BoxDecoration(
                color: isDark ? Colors.grey.shade800 : Colors.white,
                borderRadius: BorderRadius.circular(16),
              ),
            ),
          ),
        );
      },
    );
  }
}
