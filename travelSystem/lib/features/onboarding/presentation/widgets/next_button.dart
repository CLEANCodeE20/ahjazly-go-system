import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../../core/constants/Color.dart';
import '../../controller/OnboardingControler.dart';


class OnboardingNextButton extends GetView<OnboardingController> {
  const OnboardingNextButton({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 30),
      height: 50,
      width: 300,
      child: ElevatedButton(
        onPressed: () {
          controller.next();
        },
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColor.primary,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(25),
          ),
          elevation: 5,
          shadowColor: AppColor.primary.withOpacity(0.4),
        ),
        child: Text(
          "63".tr, // "Continue" or similar
          style: const TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
            fontFamily: 'Cairo', // Assuming Cairo is the font
          ),
        ),
      ),
    );
  }
}