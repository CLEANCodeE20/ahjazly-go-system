import 'package:carousel_slider/carousel_slider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../../core/constants/Color.dart';
import '../../../../core/constants/dimensions.dart';
import '../../../profile/presentation/widgets/ActionCard.dart';
import '../../../profile/presentation/widgets/SectionHeader.dart';
import '../../controller/home_section_controller.dart';

import '../../../../core/data/static/DataQuickActions.dart';
import '../widgets/AnimatedPlaceholder.dart';
import '../widgets/CompanyLogos.dart';
import 'package:flutter/services.dart';
import '../../../../shared/widgets/app_network_image.dart';
import '../../../../shared/widgets/section_title.dart';
import '../../../../shared/widgets/info_card.dart';


class HomeSection extends StatelessWidget {
  const HomeSection({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(HomeSectionController());

    return CustomScrollView(
      slivers: [
        // مساحة أعلى بسيطة
        const SliverToBoxAdapter(child: SizedBox(height: 12)),

        // السلايدر + المؤشر داخل كارد واحدة
        SliverToBoxAdapter(
          child: Obx(() {
            if (controller.isLoadingBanners.value) {
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: AnimatedPlaceholder(
                  height: 170,
                  text: 'جاري تحميل العروض...'.tr,
                ),
              );
            }

            if (controller.banners.isEmpty) {
              return const SizedBox.shrink();
            }

            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                children: [
                  _buildCarouselSlider(context, controller),
                  const SizedBox(height: 8),
                  _buildSliderIndicator(context, controller),
                ],
              ),
            ).animate().fadeIn(duration: 600.ms).slideY(begin: 0.2, end: 0);
          }),
        ),

        const SliverToBoxAdapter(child: SizedBox(height: 20)),

        // عنوان الشركات
        SliverPadding(
          padding: EdgeInsets.symmetric(
            horizontal: AppDimensions.paddingMedium,
            vertical: AppDimensions.paddingSmall,
          ),
          sliver: SliverToBoxAdapter(
            child: SectionHeader(title: '113'.tr).animate().fadeIn(delay: 100.ms).slideX(begin: -0.1, end: 0),
          ),
        ),

        const SliverToBoxAdapter(child: SizedBox(height: 8)),

        // شعارات الشركات
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: AnimatedSwitcher(
              duration: AppDimensions.animationDurationSlow,
              transitionBuilder: (child, animation) => FadeTransition(
                opacity: animation,
                child: SlideTransition(
                  position: Tween<Offset>(
                    begin: const Offset(0.1, 0),
                    end: Offset.zero,
                  ).animate(animation),
                  child: child,
                ),
              ),
              child: controller.companyLogos.isNotEmpty
                  ? const CompanyLogos().animate().fadeIn(delay: 200.ms)
                  : AnimatedPlaceholder(
                      height: 70,
                      text: 'جاري تحميل الشركات...',
                    ),
            ),
          ),
        ),

        const SliverToBoxAdapter(child: SizedBox(height: 20)),
        // عنوان الخدمات الأخرى
        SliverPadding(
          padding: EdgeInsets.symmetric(
            horizontal: AppDimensions.paddingMedium,
            vertical: AppDimensions.paddingSmall,
          ),
          sliver: SliverToBoxAdapter(
            child: SectionHeader(title: '114'.tr).animate().fadeIn(delay: 300.ms).slideX(begin: -0.1, end: 0),
          ),
        ),

        const SliverToBoxAdapter(child: SizedBox(height: 8)),

        // كروت المعلومات
        SliverPadding(
          padding: EdgeInsets.symmetric(
            horizontal: AppDimensions.paddingMedium,
          ),
          sliver: SliverToBoxAdapter(
            child: Wrap(
              spacing: AppDimensions.spacingSmall,
              runSpacing: AppDimensions.spacingSmall,
              children: quickActionsservic
                  .asMap()
                  .entries
                  .map((entry) {
                    int index = entry.key;
                    var action = entry.value;
                    return ActionCard(action: action)
                        .animate()
                        .fadeIn(delay: (400 + (index * 100)).ms)
                        .slideY(begin: 0.2, end: 0);
                  })
                  .toList(),
            ),
          ),
        ),

        const SliverToBoxAdapter(child: SizedBox(height: 24)),
      ],
    );
  }

  Widget _buildCarouselSlider(BuildContext context, HomeSectionController controller) {
    return Card(
      elevation: 4,
      shadowColor: Colors.black.withOpacity(Theme.of(context).brightness == Brightness.dark ? 0.3 : 0.08),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      clipBehavior: Clip.antiAlias,
      child: CarouselSlider.builder(
        itemCount: controller.banners.length,
        itemBuilder: (context, index, realIndex) {
          final banner = controller.banners[index];
          return InkWell(
            onTap: () => controller.onBannerTap(banner),
            child: AppNetworkImage(
              imageUrl: banner.imageUrl,
              fit: BoxFit.cover,
            ),
          );
        },
        options: CarouselOptions(
          height: 170,
          viewportFraction: 1,
          autoPlay: true,
          autoPlayInterval: const Duration(seconds: 4),
          onPageChanged: (index, reason) {
            HapticFeedback.lightImpact(); // إضافة اهتزاز بسيط عند التغيير
            controller.onSliderPageChanged(index);
          },
        ),
      ),
    );
  }

  Widget _buildSliderIndicator(BuildContext context, HomeSectionController controller) {
    return Obx(
          () => Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: List.generate(controller.banners.length, (idx) {
          final isActive = controller.currentSliderIndex.value == idx;
          return AnimatedContainer(
            duration: const Duration(milliseconds: 250),
            width: isActive ? 22 : 8,
            height: 8,
            margin: const EdgeInsets.symmetric(horizontal: 4),
            decoration: BoxDecoration(
              color:
              isActive ? Theme.of(context).colorScheme.primary : (Theme.of(context).brightness == Brightness.dark ? Colors.grey.shade800 : Colors.grey.shade300),
              borderRadius: BorderRadius.circular(12),
            ),
          );
        }),
      ),
    );
  }


}
