import 'package:get/get.dart';



import 'package:flutter/material.dart';

import '../../../../core/constants/Color.dart';
import '../../../../core/constants/dimensions.dart';
import '../../controller/OnboardingControler.dart';


class NextButton extends GetView<OnboardingController> {
  const NextButton({super.key});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      flex: 1,
      child: Container(
        padding: EdgeInsets.symmetric(vertical: AppDimensions.paddingXLarge,horizontal: AppDimensions.paddingXLarge),
        width: 400,
        child: FilledButton(
            onPressed: (){
              controller.next();
              // Navigator.pushReplacement(context, MaterialPageRoute(builder: (context) => Login_in(),));
            },
            style:  ButtonStyle(
              shape: MaterialStatePropertyAll(RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppDimensions.radiusLarge))),
              padding: MaterialStatePropertyAll(EdgeInsets.all(AppDimensions.paddingLarge)),
              backgroundColor: MaterialStatePropertyAll(AppColor.color_primary),
            ),
            child: Text("63".tr,style: TextStyle(fontSize: AppDimensions.fontSizeXLarge),)
        ),
      ),
    );

  }
}