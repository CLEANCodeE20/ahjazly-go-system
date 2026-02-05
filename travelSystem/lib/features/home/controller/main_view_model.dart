// file: lib/controller/main_view_model.dart

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:travelsystem/TestView.dart';


// استيراد الصفحات والثوابت
import '../../../core/constants/images.dart';
import '../../auth/controller/AuthService.dart';
import '../presentation/screens/HomeSection.dart';
import '../presentation/screens/homepage.dart'; // مثال لصفحة البحث أو حجوزاتي
import '../presentation/screens/notification.dart'; // مثال لصفحة الإعدادات


import '../../trips/presentation/screens/Reservations.dart';
import '../../trips/presentation/screens/trips_page.dart';


/// كلاس مساعد لتنظيم بيانات كل عنصر تنقل في مكان واحد
class NavItem {
  final String image;
  final String activeImage;
  final String label;
  final Widget page;

  NavItem({
    required this.image,
    required this.activeImage,
    required this.label,
    required this.page,
  });
}

class MainViewModel extends GetxController {
  // --- Dependencies ---
  final AuthService _authService = Get.find();

  // --- State for Main Navigation ---
  var selectedIndex = 0.obs;
  late PageController pageController;
  final RxList<NavItem> navItems = <NavItem>[].obs;

  // --- Lifecycle Methods ---
  @override
  void onInit() {
    super.onInit();
    pageController = PageController();
    _buildNavigationItems();
    // الاستماع لتغييرات حالة المصادقة لإعادة بناء الواجهة تلقائيًا
    ever(_authService.userStatus, (_) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _handleAuthChange());
    });
  }

  @override
  void onClose() {
    pageController.dispose();
    super.onClose();
  }

  // --- Core Logic ---

  /// يتم استدعاؤها تلقائيًا عند تغيير حالة المستخدم (تسجيل دخول/خروج)
  void _handleAuthChange() {
    _buildNavigationItems();
    // الانتقال بأمان إلى الصفحة الأولى لمنع بقاء المستخدم في صفحة محظورة
    onItemTapped(0);
  }


  void _buildNavigationItems() {
    // تعريف جميع العناصر الممكنة
    final home = NavItem(image: AppImage.image_home, activeImage: AppImage.image_home_active, label: '40'.tr, page: const HomeSection());
    final search = NavItem(image: 'assets/icons/search.png', activeImage: 'assets/icons/search_active.png', label: '50'.tr, page: const Homepage()); // استبدلها بصفحة البحث الفعلية
    final settings = NavItem(image: AppImage.image_setting, activeImage: AppImage.image_setting_active, label: '43'.tr, page: const Homepage());
    final bookings = NavItem(image: AppImage.image_event, activeImage: AppImage.image_event_active, label: '46'.tr, page: const Reservations(),);
    final travelers = NavItem(image: AppImage.image_travelers, activeImage: AppImage.image_travelers, label: '42'.tr, page: const HomeSection());

    // بناء القائمة بناءً على حالة المستخدم+
    if (_authService.isGuest) {
      // حالة الزائر: الرئيسية، البحث، الإعدادات
      navItems.value = [home,settings];
    } else {
      // حالة المستخدم المسجل: كل العناصر
      navItems.value = [home, bookings, travelers, settings,];
    }
  }

  // --- UI Event Handlers ---

  void onItemTapped(int index) {
    if (index < 0 || index >= navItems.length) return;
    selectedIndex.value = index;
    if (pageController.hasClients) {
      pageController.animateToPage(index, duration: const Duration(milliseconds: 350), curve: Curves.easeInOutCubic);
    }
  }

  void onPageChanged(int index) {
    if (index < 0 || index >= navItems.length) return;
    selectedIndex.value = index;
  }
}
