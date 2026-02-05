
import 'package:flutter/material.dart';
import 'package:get/get.dart';


import '../../../../core/constants/Color.dart';
import '../../../../core/constants/dimensions.dart';
import '../../controller/OnboardingControler.dart';
import '../../data/static/DataonBorading.dart';

class onBordingControler extends StatelessWidget {
  const onBordingControler({super.key});

  @override
  Widget build(BuildContext context) {
    return GetBuilder<OnboardingController>(builder: (controller) =>
        Expanded(
        flex: 0,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            ...List.generate(Data_onBorading.length,
                    (index) => AnimatedContainer(
                  duration: AppDimensions.animationDurationMedium,
                  margin: EdgeInsets.only(right: 5),
                  width: controller.currentPage==index?20 :10 ,
                  height: 10,
                  decoration: BoxDecoration(
                      color: AppColor.color_primary,
                      borderRadius: BorderRadius.circular(AppDimensions.radiusLarge)
                  ),
                )
            )
          ],
        )
    ),);
  }
}
