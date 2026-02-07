import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:shimmer/shimmer.dart';

import '../../controller/home_section_controller.dart';
import 'FadeInLogoWidget.dart';

class CompanyLogos extends GetView<HomeSectionController> {
  const CompanyLogos({super.key});

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      final hasLogos = controller.companyLogos.isNotEmpty;

      return SizedBox(
        height: 70,
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 300),
          switchInCurve: Curves.easeOut,
          switchOutCurve: Curves.easeIn,
          child: hasLogos ? _buildRealLogos() : _buildShimmerAnimation(),
        ),
      );
    });
  }

  // الشعارات الحقيقية
  Widget _buildRealLogos() {
    return ListView.separated(
      key: const ValueKey('logos'),
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      physics: const BouncingScrollPhysics(),
      itemCount: controller.companyLogos.length,
      itemBuilder: (context, index) {
        final img = controller.companyLogos[index];
        return FadeInLogoWidget(
          imageUrl: img,
          duration: 400 + index * 80,
        );
      },
      separatorBuilder: (context, index) => const SizedBox(width: 16),
    );
  }

  // أنيميشن Shimmer أثناء التحميل
  Widget _buildShimmerAnimation() {
    return Shimmer.fromColors(
      key: const ValueKey('logosShimmer'),
      baseColor: Colors.grey.shade300,
      highlightColor: Colors.grey.shade100,
      period: const Duration(milliseconds: 1200), // سرعة الحركة
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        physics: const BouncingScrollPhysics(),
        itemCount: 5, // عدد سكليتون مؤقت
        itemBuilder: (context, index) => Container(
          width: 70,
          height: 40,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        separatorBuilder: (context, index) => const SizedBox(width: 16),
      ),
    );
  }
}
