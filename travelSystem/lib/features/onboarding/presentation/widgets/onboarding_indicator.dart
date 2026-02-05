import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../../core/constants/Color.dart';

import '../../controller/OnboardingControler.dart';
import '../../data/static/DataonBorading.dart';


class OnboardingIndicator extends StatelessWidget {
  const OnboardingIndicator({super.key});

  @override
  Widget build(BuildContext context) {
    final OnboardingController controller = Get.find<OnboardingController>();
    return Obx(
      () => Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          ...List.generate(
            Data_onBorading.length,
            (index) => AnimatedContainer(
              margin: const EdgeInsets.only(right: 5),
              duration: const Duration(milliseconds: 300),
              width: controller.currentPage.value == index ? 20 : 6,
              height: 6,
              decoration: BoxDecoration(
                color: controller.currentPage.value == index
                    ? AppColor.primary
                    : AppColor.primary.withOpacity(0.3),
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
