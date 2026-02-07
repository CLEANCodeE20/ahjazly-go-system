// lib/view/screen/faq/faq_page.dart
import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../../core/constants/Color.dart';
import '../../../../core/constants/dimensions.dart';
import '../../controller/faq_controller.dart';


class FaqPage extends StatelessWidget {
  const FaqPage({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.find<FaqController>();

    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: theme.appBarTheme.backgroundColor,
        elevation: isDark ? 0 : 0.5,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new, color: isDark ? Colors.white : Colors.black, size: 20),
          onPressed: () => Get.back(),
        ),
        title: Text(
          "الأسئلة الشائعة".tr,
          style: TextStyle(
            color: isDark ? Colors.white : Colors.black,
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
            color: isDark ? theme.colorScheme.surface.withOpacity(0.5) : Colors.white,
            padding: const EdgeInsets.fromLTRB(20, 10, 20, 20),
            child: Column(
              children: [
                _buildSearchBar(context, controller),
                const SizedBox(height: 15),
                _buildCategoryChips(context, controller),
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
                  return _buildFaqCard(context, controller, index);
                },
              );
            }),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar(BuildContext context, FaqController controller) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withOpacity(0.05) : Colors.grey.shade100,
        borderRadius: BorderRadius.circular(15),
      ),
      child: TextField(
        onChanged: (val) => controller.fetchFromApi(),
        style: const TextStyle(fontFamily: 'Cairo', fontSize: 14),
        decoration: InputDecoration(
          hintText: 'ابحث عن إجابة...'.tr,
          prefixIcon: Icon(Icons.search, color: isDark ? Colors.white54 : Colors.grey),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(vertical: 12),
        ),
      ),
    );
  }

  Widget _buildCategoryChips(BuildContext context, FaqController controller) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
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
                color: isSelected ? Colors.white : (isDark ? Colors.white70 : Colors.grey.shade700),
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              )),
              selected: isSelected,
              onSelected: (val) {},
              backgroundColor: isDark ? Colors.white.withOpacity(0.05) : Colors.white,
              selectedColor: AppColor.primary,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
                side: BorderSide(color: isSelected ? Colors.transparent : (isDark ? Colors.white10 : Colors.grey.shade300)),
              ),
              showCheckmark: false,
            ),
          );
        },
      ),
    );
  }

  Widget _buildFaqCard(BuildContext context, FaqController controller, int index) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final item = controller.faqs[index];
    final expanded = item.isExpanded;

    return Container(
      margin: const EdgeInsets.only(bottom: 15),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.2 : 0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          initiallyExpanded: expanded,
          onExpansionChanged: (val) => controller.toggleExpand(index),
          leading: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColor.primary.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.help_outline, color: AppColor.primary, size: 20),
          ),
          title: Text(
            item.question,
            style: TextStyle(
              fontFamily: 'Cairo',
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white : const Color(0xFF2D3142),
            ),
          ),
          trailing: AnimatedRotation(
            turns: expanded ? 0.5 : 0,
            duration: const Duration(milliseconds: 200),
            child: Icon(Icons.keyboard_arrow_down_rounded, color: AppColor.primary),
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
                  color: isDark ? Colors.white70 : Colors.grey.shade700,
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
