import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../../core/constants/Color.dart';
import '../../../../core/constants/dimensions.dart';
import '../../controller/BookingController.dart';


class TripTypeDropdown extends GetView<BookingController>{
  const TripTypeDropdown({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(Get.context!);
    return Obx(
          () => DropdownButtonFormField<String>(
        decoration: InputDecoration(
          labelText: '56'.tr,
          labelStyle: TextStyle(
            color: AppColor.color_primary,
            fontWeight: FontWeight.w700,
            fontFamily: "Cairo",
          ),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          filled: true,
          fillColor: theme.brightness == Brightness.dark
              ? AppColor.textSecondary
              : AppColor.primaryLighter,
          contentPadding:  EdgeInsets.symmetric(horizontal: AppDimensions.paddingMedium, vertical: AppDimensions.paddingSmall),
        ),
        value: controller.selectedTripType.value,
        items: controller.tripTypes
            .map((type) => DropdownMenuItem(
          value: type,
          child: Align(
            alignment: Alignment.centerRight,
            child: Text(
              type,
              style: const TextStyle(fontSize: AppDimensions.fontSizeLarge, fontFamily: "Cairo"),
            ),
          ),
        ))
            .toList(),
        onChanged: controller.setTripType,
        isExpanded: true,
      ),
    );
  }
}
