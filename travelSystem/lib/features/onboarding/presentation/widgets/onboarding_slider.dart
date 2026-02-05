import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:travelsystem/core/constants/Color.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../controller/OnboardingControler.dart';
import '../../data/static/DataonBorading.dart';


class OnboardingSlider extends GetView<OnboardingController> {
  const OnboardingSlider({super.key});

  @override
  Widget build(BuildContext context) {
    return PageView.builder(
      controller: controller.pageController,
      onPageChanged: (val) {
        controller.onPageChanged(val);
      },
      itemCount: Data_onBorading.length,
      itemBuilder: (context, index) => Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const SizedBox(height: 20),
          Expanded(
            flex: 3,
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 20),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 20,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: Image.asset(
                  Data_onBorading[index].image!,
                  fit: BoxFit.contain, // Or cover depending on image
                ),
              ).animate(key: ValueKey('image_$index')).fadeIn(duration: 800.ms).scale(begin: const Offset(0.8, 0.8), end: const Offset(1, 1), curve: Curves.easeOutBack),
            ),
          ),
          const SizedBox(height: 40),
          Expanded(
            flex: 1,
            child: Column(
              children: [
                Text(
                  Data_onBorading[index].titel!,
                  style: AppTextStyles.headline.copyWith(
                    color: AppColor.primary,
                    fontSize: 24,
                  ),
                  textAlign: TextAlign.center,
                ).animate(key: ValueKey('title_$index')).fadeIn(duration: 600.ms, delay: 200.ms).slideY(begin: 0.2, end: 0),
                const SizedBox(height: 15),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 30),
                  child: Text(
                    Data_onBorading[index].descrption!,
                    textAlign: TextAlign.center,
                    style: AppTextStyles.body.copyWith(
                      height: 1.5,
                      fontSize: 16,
                    ),
                  ),
                ).animate(key: ValueKey('desc_$index')).fadeIn(duration: 600.ms, delay: 400.ms).slideY(begin: 0.2, end: 0),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
