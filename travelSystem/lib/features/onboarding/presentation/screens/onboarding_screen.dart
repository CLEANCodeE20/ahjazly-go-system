import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:travelsystem/core/constants/Color.dart';
import '../../controller/OnboardingControler.dart';

import '../widgets/next_button.dart';
import '../widgets/onboarding_indicator.dart';
import '../widgets/onboarding_slider.dart';

class OnboardingScreen extends StatelessWidget {
  const OnboardingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    Get.put(OnboardingController());
    return Scaffold(
      backgroundColor: AppColor.background,
      body: SafeArea(
        child: Column(
          children: [
            const Expanded(
              flex: 3,
              child: OnboardingSlider(),
            ),
            Expanded(
              flex: 1,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: const [
                  OnboardingIndicator(),
                  OnboardingNextButton(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
