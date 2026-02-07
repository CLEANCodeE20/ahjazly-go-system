import 'dart:ui';
import 'package:lottie/lottie.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../../core/classes/StatusRequest.dart';
import '../../../../core/constants/Color.dart';
import '../../../../core/constants/dimensions.dart';
import '../../controller/BookingController.dart';

import '../widgets/TripTypeDropdown.dart';
import '../widgets/DynamicBackground.dart';
import '../widgets/RecentSearchWidget.dart';
import '../widgets/PopularDestinationsWidget.dart';
import '../../../../shared/widgets/no_internet_widget.dart';
import '../../../../shared/widgets/section_title.dart';
import '../../../../shared/widgets/custom_button_v2.dart';
import '../../../../shared/widgets/modern_dropdown.dart';
import '../../../../shared/widgets/glassmorphic_date_field.dart';

class BookingView extends GetView<BookingController> {
  const BookingView({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: Colors.transparent,
      extendBodyBehindAppBar: true,
      appBar: _buildAppBar(theme),
      body: DynamicBackground(
        child: Center(
          child: Obx(() {
            if (controller.requst.value == StatRequst.noInternet) {
              return NoInternetWidget(onRetry: controller.searchTrips);
            }
            return _buildBody(context);
          }),
        ),
      ),
    );
  }

  AppBar _buildAppBar(ThemeData theme) {
    return AppBar(
      elevation: 0,
      centerTitle: true,
      title: Text(
        "50".tr,
        style: TextStyle(
          color: AppColor.primary,
          fontFamily: "Cairo",
          fontWeight: FontWeight.bold,
          fontSize: AppDimensions.fontSizeXXLarge,
          letterSpacing: 0.2,
        ),
      ),
      backgroundColor: Colors.transparent,
      iconTheme: IconThemeData(color: AppColor.primary),
      leading: IconButton(
        tooltip: '53'.tr,
        onPressed: () => Get.back(),
        icon: const Icon(Icons.arrow_back_rounded),
      ),
    );
  }

  Widget _buildBody(BuildContext context) {
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      child: Padding(
        padding: EdgeInsets.symmetric(
          horizontal: AppDimensions.paddingMedium,
          vertical: AppDimensions.paddingLarge + 60,
        ),
        child: Column(
          children: [
            _buildHeader(context),
            const SizedBox(height: 30),
            _buildBookingCard(context),
            const SizedBox(height: 30),
            
            // Recent Searches
            RecentSearchWidget(
              searches: controller.recentSearches,
              onSelect: controller.quickSearch,
            ).animate().fadeIn(delay: 800.ms).slideX(),
            
            const SizedBox(height: 30),
            
            // Popular Destinations
            PopularDestinationsWidget(
              destinations: controller.popularDestinations,
              onSelect: (city) => controller.setArrivalCity(city),
            ).animate().fadeIn(delay: 1000.ms).slideY(begin: 0.2, end: 0),
            
            const SizedBox(height: 40),
          ],
        ).animate().fadeIn(duration: 600.ms).slideY(begin: 0.1, end: 0),
      ),
    );
  }

  Widget _buildBookingCard(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    return Container(
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withOpacity(0.05) : Colors.white.withOpacity(0.7),
        borderRadius: BorderRadius.circular(AppDimensions.radiusXXLarge),
        border: Border.all(
          color: isDark ? Colors.white.withOpacity(0.1) : AppColor.primary.withOpacity(0.2),
          width: 0.8, // Thinner border for luxury feel
        ),
        boxShadow: [
          BoxShadow(
            color: AppColor.primary.withOpacity(0.08),
            offset: const Offset(0, 15),
            blurRadius: 40,
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(AppDimensions.radiusXXLarge),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20), // Increased blur
          child: Padding(
            padding: EdgeInsets.all(AppDimensions.paddingXLarge),
            child: Form(
              key: controller.formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _buildFormFields(),
                  const SizedBox(height: AppDimensions.spacingXLarge),
                  _buildSearchButton(),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      children: [
        // Lottie Animation
        SizedBox(
          height: 180,
          child: Lottie.asset(
            'image/travelAnm.json',
            fit: BoxFit.contain,
          ),
        ),
        const SizedBox(height: 10),
        
        // Welcome Message
        Text(
          controller.welcomeMessage,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: AppDimensions.fontSizeXXLarge,
            color: AppColor.primary,
            shadows: [
              Shadow(
                color: AppColor.primary.withOpacity(0.3),
                blurRadius: 15,
                offset: const Offset(0, 4),
              ),
            ],
            fontWeight: FontWeight.bold,
            fontFamily: 'Cairo',
            height: 1.3,
          ),
        ).animate().fadeIn(delay: 400.ms).scale(),
        
        const SizedBox(height: 8),
        
        // Subtitle
        Text(
          'اختر وجهتك وموعد سفرك بسهولة',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: AppDimensions.fontSizeLarge,
            color: isDark ? Colors.white70 : AppColor.textSecondary.withOpacity(0.8),
            fontWeight: FontWeight.w500,
            fontFamily: 'Cairo',
          ),
        ).animate().fadeIn(delay: 600.ms),
      ],
    );
  }

  Widget _buildDivider() {
    return Container(
      height: 2,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColor.primary.withOpacity(0.1),
            AppColor.primary,
            AppColor.primary.withOpacity(0.1),
          ],
        ),
        borderRadius: BorderRadius.circular(2),
      ),
    );
  }

  Widget _buildFormFields() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Cities Section with Modern Dropdown
        SectionTitle(title: '58'.tr),
        SizedBox(height: AppDimensions.spacingMedium),
        _buildCitiesRow(),
        SizedBox(height: AppDimensions.spacingLarge),

        // Trip Type Section
        SectionTitle(title: '57'.tr),
        SizedBox(height: AppDimensions.spacingMedium),
        TripTypeDropdown(),
        SizedBox(height: AppDimensions.spacingLarge),

        // Date Section with Glassmorphic Field
        Obx(() => GlassmorphicDateField(
          value: controller.travelDate.value,
          onChanged: controller.setDate,
          label: '59'.tr,
          firstDate: DateTime.now(),
          lastDate: DateTime.now().add(Duration(days: 365)),
        )),
      ],
    );
  }

  Widget _buildCitiesRow() {
    return Row(
      children: [
        // Departure City
        Expanded(
          child: Obx(() => ModernDropdown<String>(
            value: controller.departureCity.value,
            items: controller.cities,
            onChanged: controller.setDepartureCity,
            label: '55'.tr,
            icon: Icons.flight_takeoff_rounded,
            hint: 'اختر مدينة المغادرة',
            excludeItems: (city) => [controller.arrivalCity.value],
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'الرجاء اختيار مدينة المغادرة';
              }
              return null;
            },
          )),
        ),
        
        SizedBox(width: 12),
        
        // Swap Button
        CitySwapButton(
          onTap: controller.swapCities,
        ),
        
        SizedBox(width: 12),
        
        // Arrival City
        Expanded(
          child: Obx(() => ModernDropdown<String>(
            value: controller.arrivalCity.value,
            items: controller.cities,
            onChanged: controller.setArrivalCity,
            label: '54'.tr,
            icon: Icons.flight_land_rounded,
            hint: 'اختر مدينة الوصول',
            excludeItems: (city) => [controller.departureCity.value],
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'الرجاء اختيار مدينة الوصول';
              }
              return null;
            },
          )),
        ),
      ],
    );
  }

  Widget _buildSearchButton() {
    return Container(
      width: double.infinity,
      height: 55,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(15),
        gradient: const LinearGradient(
          colors: [
            AppColor.primary,
            Color(0xFF1E1B4B), // Deep Indigo for luxury depth
          ],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
        boxShadow: [
          BoxShadow(
            color: AppColor.primary.withOpacity(0.3),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            if (controller.formKey.currentState!.validate()) {
              controller.searchTrips();
            }
          },
          borderRadius: BorderRadius.circular(15),
          child: Center(
            child: Obx(
              () => controller.requst.value == StatRequst.Loding
                  ? const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2.5,
                      ),
                    )
                  : Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.search_rounded, color: Colors.white, size: 24),
                        const SizedBox(width: 10),
                        Text(
                          '52'.tr,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            fontFamily: "Cairo",
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
            ),
          ),
        ),
      ),
    );
  }
}
