import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';

import '../../features/onboarding/controller/OnboardingControler.dart';
import '../../features/onboarding/presentation/widgets/onBordingControler.dart';

class Smoth  extends GetView<OnboardingController> {
   Smoth ({super.key});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      flex: 0,
      child: Align(
        alignment: AlignmentDirectional.bottomCenter,
        child: SmoothPageIndicator(
          controller: controller.pageController,
          count: 3,
          effect: const WormEffect(
            dotHeight: 15,
            dotWidth: 20,
            activeDotColor: Color(0xffFFD934),
            dotColor: Colors.white,
          ),
        ),
      ),
    );
  }
}
