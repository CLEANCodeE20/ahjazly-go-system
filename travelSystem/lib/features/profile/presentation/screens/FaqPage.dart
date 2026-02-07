// lib/view/screen/faq/faq_page.dart
import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../../core/constants/Color.dart';
import '../../../../core/constants/dimensions.dart';
import '../../../../features/common/controller/faq_controller.dart';


class FaqPage extends StatelessWidget {
  const FaqPage({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.find<FaqController>();

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Colors.black, size: 20),
          onPressed: () => Get.back(),
        ),
        title: Text(
          "الأسئلة الشائعة".tr,
          style: const TextStyle(
            color: Colors.black,
            fontFamily: "Cairo",
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        centerTitle: true,
      ),
      body: Column(
        children: [
          // --- Search & Categories Header ---
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(20, 10, 20, 20),
            child: Column(
              children: [
                _buildSearchBar(controller),
                const SizedBox(height: 15),
                _buildCategoryChips(controller),
              ],
            ),
          ),

          // --- FAQ List ---
          Expanded(
            child: Obx(() {
              if (controller.isLoading.value) {
                return const Center(child: CircularProgressIndicator());
              }
              if (controller.errorMessage.isNotEmpty) {
                return _buildErrorState(controller.errorMessage.value);
              }
              if (controller.faqs.isEmpty) {
                return _buildEmptyState();
              }

              return ListView.builder(
                padding: const EdgeInsets.all(20),
                physics: const BouncingScrollPhysics(),
                itemCount: controller.faqs.length,
                itemBuilder: (context, index) {
                  return _buildFaqCard(controller, index);
                },
              );
            }),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar(FaqController controller) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.grey.shade100,
        borderRadius: BorderRadius.circular(15),
      ),
      child: TextField(
        onChanged: (val) => controller.fetchFromApi(),
        style: const TextStyle(fontFamily: 'Cairo', fontSize: 14),
        decoration: InputDecoration(
          hintText: 'ابحث عن إجابة...'.tr,
          prefixIcon: const Icon(Icons.search, color: Colors.grey),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(vertical: 12),
        ),
      ),
    );
  }

  Widget _buildCategoryChips(FaqController controller) {
    final categories = ['الكل', 'الدفع', 'الحجوزات', 'الخدمات', 'التأمين'];
    return SizedBox(
      height: 40,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        itemCount: categories.length,
        itemBuilder: (context, index) {
          final isSelected = index == 0; // Simple logic for now
          return Padding(
            padding: const EdgeInsets.only(left: 10),
            child: FilterChip(
              label: Text(categories[index], style: TextStyle(
                fontFamily: 'Cairo',
                fontSize: 12,
                color: isSelected ? Colors.white : Colors.grey.shade700,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              )),
              selected: isSelected,
              onSelected: (val) {},
              backgroundColor: Colors.white,
              selectedColor: AppColor.color_primary,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
                side: BorderSide(color: isSelected ? Colors.transparent : Colors.grey.shade300),
              ),
              showCheckmark: false,
            ),
          );
        },
      ),
    );
  }

  Widget _buildFaqCard(FaqController controller, int index) {
    final item = controller.faqs[index];
    final expanded = item.isExpanded;

    return Container(
      margin: const EdgeInsets.only(bottom: 15),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Theme(
        data: ThemeData().copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          initiallyExpanded: expanded,
          onExpansionChanged: (val) => controller.toggleExpand(index),
          leading: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColor.color_primary.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.help_outline, color: AppColor.color_primary, size: 20),
          ),
          title: Text(
            item.question,
            style: const TextStyle(
              fontFamily: 'Cairo',
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: Color(0xFF2D3142),
            ),
          ),
          trailing: AnimatedRotation(
            turns: expanded ? 0.5 : 0,
            duration: const Duration(milliseconds: 200),
            child: Icon(Icons.keyboard_arrow_down_rounded, color: AppColor.color_primary),
          ),
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
              child: Text(
                item.answer,
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 13,
                  height: 1.6,
                  color: Colors.grey.shade700,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.search_off_rounded, size: 80, color: Colors.grey.shade300),
          const SizedBox(height: 15),
          Text(
            'لا توجد نتائج مطابقة لبحثك'.tr,
            style: const TextStyle(fontFamily: 'Cairo', color: Colors.grey),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState(String error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline_rounded, size: 60, color: Colors.redAccent),
          const SizedBox(height: 15),
          Text(error, style: const TextStyle(fontFamily: 'Cairo', color: Colors.red)),
        ],
      ),
    );
  }
}
