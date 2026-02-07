import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../../core/constants/Color.dart';
import '../../../../core/constants/dimensions.dart';
import '../../controller/BookingController.dart';


class DropdownCities extends GetView<BookingController> {

   DropdownCities({super.key,});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return  Row(
      children: [
        Expanded(
          child: Obx(
                () => DropdownButtonFormField<String>(
              decoration: InputDecoration(
                labelText: '55'.tr,
                labelStyle: TextStyle(
                  color: AppColor.color_primary,
                  fontWeight: FontWeight.w700,
                  fontFamily: "Cairo",
                ),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(AppDimensions.radiusLarge)),
                filled: true,
                fillColor: theme.brightness == Brightness.dark
                    ? AppColor.textSecondary
                    : AppColor.primaryLighter,
                prefixIcon: CircleAvatar(
                  backgroundColor: AppColor.color_primary.withOpacity(0.08),
                  radius: AppDimensions.radiusXXLarge,
                  child: Icon(Icons.navigation, color: AppColor.color_primary, size: AppDimensions.iconSizeMedium),
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: AppDimensions.paddingMedium, vertical: AppDimensions.paddingSmall),
              ),
              value: controller.cities.contains(controller.departureCity.value)
                  ? controller.departureCity.value
                  : null,
              items: controller.cities
                  .where((city) => city != controller.arrivalCity.value)
                  .map((city) => DropdownMenuItem(
                value: city,
                child: Align(
                  alignment: Alignment.centerRight,
                  child: Text(
                    city,
                    textAlign: TextAlign.right,
                    style: const TextStyle(fontSize: AppDimensions.fontSizeLarge, fontFamily: "Cairo"),
                  ),
                ),
              ))
                  .toList(),
              onChanged: controller.setDepartureCity,
              isExpanded: true,
            ),
          ),
        ),
        const SizedBox(width: 12),
        Hero(
          tag: 'swap-arrows',
          child: Icon(Icons.compare_arrows, color: Colors.blueGrey[400], size: 32),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Obx(
                () => DropdownButtonFormField<String>(
              decoration: InputDecoration(
                labelText: '54'.tr,
                labelStyle: TextStyle(
                  color: AppColor.color_primary,
                  fontWeight: FontWeight.w700,
                  fontFamily: "Cairo",
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AppDimensions.radiusLarge),
                  borderSide: BorderSide(color: AppColor.color_primary, width: 1.4),
                ),
                filled: true,
                fillColor: theme.brightness == Brightness.dark
                    ? AppColor.textSecondary
                    : AppColor.primaryLighter,
                prefixIcon: CircleAvatar(
                  backgroundColor: AppColor.color_primary.withOpacity(0.08),
                  radius: 18,
                  child: Icon(Icons.place, color: AppColor.color_primary, size: 22),
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              ),
              value: controller.cities.contains(controller.arrivalCity.value)
                  ? controller.arrivalCity.value
                  : null,
              items: controller.cities
                  .where((city) => city != controller.departureCity.value)
                  .map((city) => DropdownMenuItem(
                value: city,
                child: Align(
                  alignment: Alignment.centerRight,
                  child: Text(
                    city,
                    textAlign: TextAlign.right,
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.grey[700],
                      fontFamily: "Cairo",
                    ),
                  ),
                ),
              ))
                  .toList(),
              onChanged: controller.setArrivalCity,
              isExpanded: true,
            ),
          ),
        ),
      ],
    );
  }
}
