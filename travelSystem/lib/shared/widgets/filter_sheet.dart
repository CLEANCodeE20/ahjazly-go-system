import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:travelsystem/core/constants/Color.dart';
import '../../features/trips/presentation/controllers/trip_controller.dart';

class FilterSheet extends StatelessWidget {
  final TripController controller;
  const FilterSheet({super.key, required this.controller});

  @override
  Widget build(BuildContext context) {
    final tripTypes = controller.trips.map((t) => t.tripType).toSet().toList();

    return Padding(
      padding: MediaQuery.of(context).viewInsets,
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 36, height: 4,
                margin: const EdgeInsets.only(bottom: 12),
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
            ),
            const Text('فلترة الرحلات', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17)),
            const SizedBox(height: 14),
            // فلترة السعر
            const Text('أقصى سعر'),
            Obx(() => Slider(
              min: 0,
              max: 1000,
              divisions: 20,
              label: '${controller.maxPrice.value} ريال',
              value: controller.maxPrice.value.toDouble(),
              onChanged: (value) => controller.maxPrice.value = value.round(),
              activeColor:  AppColor.color_primary,
            )),
            const SizedBox(height: 10),
            // فلترة نوع الرحلة (شركة أو تصنيف الرحلة)
            const Text('نوع الرحلة'),
            Obx(() => DropdownButton<String>(
              isExpanded: true,
              value: controller.selectedTripType.value.isEmpty ? null : controller.selectedTripType.value,
              hint: const Text('اختر نوع الرحلة'),
              items: tripTypes.map((type) =>
                  DropdownMenuItem(child: Text(type), value: type)).toList(),
              onChanged: (val) => controller.selectedTripType.value = val ?? '',
            )),
            const SizedBox(height: 16),
            // فلترة وقت الرحلة
            const Text('وقت الانطلاق'),
            Obx(() => Column(
              children: [
                RadioListTile(
                  title: const Text('بعد منتصف الليل'),
                  value: 'بعد منتصف الليل',
                  groupValue: controller.selectedTimeFilter.value,
                  onChanged: (v) => controller.selectedTimeFilter.value = v!,
                  activeColor: AppColor.color_primary,
                ),
                RadioListTile(
                  title: const Text('قبل الظهيرة'),
                  value: 'قبل الظهيرة',
                  groupValue: controller.selectedTimeFilter.value,
                  onChanged: (v) => controller.selectedTimeFilter.value = v!,
                  activeColor: AppColor.color_primary,
                ),
                RadioListTile(
                  title: const Text('بعد الظهيرة'),
                  value: 'بعد الظهيرة',
                  groupValue: controller.selectedTimeFilter.value,
                  onChanged: (v) => controller.selectedTimeFilter.value = v!,
                  activeColor: AppColor.color_primary,
                ),
                RadioListTile(
                  title: const Text('المساء'),
                  value: 'المساء',
                  groupValue: controller.selectedTimeFilter.value,
                  onChanged: (v) => controller.selectedTimeFilter.value = v!,
                  activeColor: AppColor.color_primary,
                ),
              ],
            )),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(child: OutlinedButton(
                  onPressed: () {
                    controller.resetFilter();
                    Navigator.pop(context);
                  },
                  child: const Text('إلغاء'),
                )),
                const SizedBox(width: 12),
                Expanded(child: ElevatedButton(
                  onPressed: () {
                    controller.applyFilter();
                    Navigator.pop(context);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColor.color_primary,
                  ),
                  child: const Text('حفظ'),
                )),
              ],
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}
