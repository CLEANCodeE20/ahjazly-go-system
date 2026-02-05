import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';

import '../../../../core/constants/Color.dart';
import '../../../../core/constants/dimensions.dart';
import '../../controller/BookingController.dart';


class DateField extends GetView<BookingController> {
  const DateField({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Obx(
          () => InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: () async {
          DateTime? picked = await showDatePicker(
            context: context,
            initialDate: controller.travelDate.value,
            firstDate: DateTime.now(),
            lastDate: DateTime(2100),
            builder: (context, child) {
              return Theme(
                data: Theme.of(context).copyWith(
                  colorScheme: ColorScheme.light(
                    primary: AppColor.color_primary,
                    onPrimary: AppColor.surface,
                    surface: AppColor.surface,
                    onSurface: AppColor.textPrimary,
                  ),
                  textButtonTheme: TextButtonThemeData(
                    style: TextButton.styleFrom(
                      foregroundColor: AppColor.color_primary,
                    ),
                  ),
                ),
                child: child!,
              );
            },
          );
          if (picked != null) controller.setDate(picked);
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 14),
          decoration: BoxDecoration(
            color: theme.brightness == Brightness.dark
                ? AppColor.textSecondary
                : AppColor.primaryLighter,
            borderRadius: BorderRadius.circular(AppDimensions.radiusXLarge),
            boxShadow: [
              BoxShadow(
                color: Colors.amber.withOpacity(0.09),
                blurRadius: 16,
                offset: const Offset(0, 7),
              ),
            ],
            border: Border.all(
              color: AppColor.color_primary.withOpacity(0.55),
              width: 1.2,
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(Icons.calendar_month_rounded, color: AppColor.color_primary, size: AppDimensions.fontSizeHeadline),
                  const SizedBox(width: 12),
                  Text(
                    '59'.tr,
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 17,
                      color: AppColor.color_primary,
                      fontFamily: "Cairo",
                    ),
                  ),
                ],
              ),
              Text(
                DateFormat('dd/MM/yyyy', 'ar').format(controller.travelDate.value),
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 17,
                  color: AppColor.color_primary,
                  fontFamily: "Cairo",
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
