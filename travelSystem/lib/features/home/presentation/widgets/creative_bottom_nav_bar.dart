// view/screen/widgets/creative_bottom_nav_bar.dart
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../../core/constants/Color.dart';
import '../../../../core/constants/images.dart';
import '../../controller/main_view_model.dart';


class CreativeBottomNavBar extends StatelessWidget {
  final Function(int) onItemTapped;

  const CreativeBottomNavBar({super.key, required this.onItemTapped});

  @override
  Widget build(BuildContext context) {
    final MainViewModel controller = Get.find();

    // قائمة بيانات الأيقونات لتجنب التكرار
    final List<Map<String, dynamic>> navItems = [
      {'image': AppImage.image_home, 'activeImage': AppImage.image_home_active, 'label': '40'.tr},
      {'image': AppImage.image_event, 'activeImage': AppImage.image_event_active, 'label': '41'.tr},
      {'image': AppImage.image_travelers, 'activeImage': AppImage.image_travelers, 'label': '42'.tr},
      {'image': AppImage.image_setting, 'activeImage': AppImage.image_setting_active, 'label': '43'.tr},
    ];

    return BottomAppBar(
      shape: const CircularNotchedRectangle(),
      notchMargin: 8.0,
      elevation: 10,
      color: Colors.white,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 4.0),
        child: Obx(
              () => Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // بناء النصف الأول من الأيقونات
              _buildNavHalf(navItems.sublist(0, 2), controller.selectedIndex.value, 0),
              // بناء النصف الثاني
              _buildNavHalf(navItems.sublist(2, 4), controller.selectedIndex.value, 2),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavHalf(List<Map<String, dynamic>> items, int currentIndex, int indexOffset) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceAround,
      children: List.generate(items.length, (index) {
        int itemIndex = index + indexOffset;
        return _CreativeBottomBarItem(
          image: items[index]['image'],
          activeImage: items[index]['activeImage'],
          label: items[index]['label'],
          isActive: currentIndex == itemIndex,
          onTap: () => onItemTapped(itemIndex),
        );
      }),
    );
  }
}

// Widget الأيقونة مع حركات إبداعية
class _CreativeBottomBarItem extends StatelessWidget {
  final String image;
  final String activeImage;
  final String label;
  final bool isActive;
  final VoidCallback onTap;

  const _CreativeBottomBarItem({
    required this.image,
    required this.activeImage,
    required this.label,
    required this.isActive,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.translucent,
      child: SizedBox(
        width: 75, // تحديد عرض ثابت لضمان التناسق
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 350),
              curve: Curves.elasticOut, // حركة مرنة وممتعة
              transform: Matrix4.translationValues(0, isActive ? -8 : 0, 0), // الأيقونة تقفز للأعلى عند تفعيلها
              child: Image.asset(
                isActive ? activeImage : image,
                width: isActive ? 32 : 26,
                height: isActive ? 32 : 26,
                color: isActive ? AppColor.color_primary : Colors.grey[600],
                colorBlendMode: BlendMode.modulate,
              ),
            ),
            const SizedBox(height: 4),
            AnimatedDefaultTextStyle(
              duration: const Duration(milliseconds: 300),
              style: TextStyle(
                color: isActive ? AppColor.color_primary : Colors.grey[700],
                fontFamily: 'Cairo',
                fontSize: isActive ? 12.5 : 11,
                fontWeight: isActive ? FontWeight.w800 : FontWeight.w500,
              ),
              child: Text(label),
            )
          ],
        ),
      ),
    );
  }
}
