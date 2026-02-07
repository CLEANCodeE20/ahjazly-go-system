import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:travelsystem/features/home/controller/main_view_model.dart';
import 'package:travelsystem/core/constants/Color.dart';
import 'package:travelsystem/core/constants/images.dart';
import 'package:travelsystem/core/constants/nameRoute.dart';
import 'package:travelsystem/core/services/theme_service.dart';


import 'package:travelsystem/shared/widgets/bottom_bar_item.dart';

import '../../../../core/functions/AlertExiteApp.dart';

class HomeView extends StatelessWidget {
  const HomeView({super.key});

  @override
  Widget build(BuildContext context) {
    final MainViewModel controller = Get.find<MainViewModel>();

    return Scaffold(
      floatingActionButton: FloatingActionButton(
        backgroundColor: Theme.of(context).colorScheme.primary,
        onPressed: () {
          Get.toNamed(AppRoute.BookingView);
        },
        child: Icon(
          Icons.search,
          color: Theme.of(context).colorScheme.onPrimary,
        ),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Theme.of(context).appBarTheme.backgroundColor,
        leading: InkWell(
          onTap: () => Get.toNamed(AppRoute.notification),
          child: Icon(Icons.notifications_outlined,
              color: Theme.of(context).colorScheme.primary, size: 28),
        ),
        actions: [
          Obx(() => IconButton(
            onPressed: () => Get.find<ThemeService>().switchTheme(),
            icon: Icon(
              Get.find<ThemeService>().isDarkMode.value ? Icons.light_mode : Icons.dark_mode,
              color: Theme.of(context).colorScheme.primary,
            ),
          )),
          Container(
            width: 80,
            height: 40,
            margin: const EdgeInsets.only(right: 8),
            decoration: BoxDecoration(
              image: DecorationImage(
                  image: AssetImage(AppImage.image_logo), fit: BoxFit.contain),
            ),
          )
        ],
      ),
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: WillPopScope(
        onWillPop: () => AlertExiteApp(),
        child: Obx(
          () => PageView(
            controller: controller.pageController,
            onPageChanged: controller.onPageChanged,
            children: controller.navItems.map((item) => item.page).toList(),
          ),
        ),
      ),
      bottomNavigationBar: Obx(
        () => BottomAppBar(
          height: 72, // Reduced to a more standard but spacious 72
          padding: EdgeInsets.zero,
          notchMargin: 10,
          shape: const CircularNotchedRectangle(),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: _buildNavItems(controller),
          ),
        ),
      ),
    );
  }

  List<Widget> _buildNavItems(MainViewModel controller) {
    List<Widget> items = [];
    for (int i = 0; i < controller.navItems.length; i++) {
      final item = controller.navItems[i];
      items.add(
        bottomBarItem(
          image: item.image,
          activeImage: item.activeImage,
          label: item.label,
          isActive: controller.selectedIndex.value == i,
          onTap: () => controller.onItemTapped(i),
        ),
      );
    }
    return items;
  }
}
