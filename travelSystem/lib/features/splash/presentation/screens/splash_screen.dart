import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:travelsystem/core/constants/nameRoute.dart';

import '../../../onboarding/controller/OnboardingControler.dart';
import '../../../../core/constants/images.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {

  @override
  void initState() {
    // TODO: implement initState
    Future.delayed(Duration(seconds: 2),() => Get.offNamed(AppRoute.onBording));
  }
  @override
  Widget build(BuildContext context) {
    return  Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        body: Center(
          child: Image(image: AssetImage(AppImage.image_logo)),
        ),
      ),
    );
  }
}
