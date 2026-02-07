
import 'package:flutter/material.dart';
import 'package:get/get.dart';


import '../../core/constants/Color.dart';
import '../../features/onboarding/controller/OnboardingControler.dart';

class NextButtont extends GetView<OnboardingController> {
  String text;
   void Function()? onPressed;
  final Color backgroundColor;
  final Color colortext;
    int size;
  NextButtont(this.size,  {super.key,required this.onPressed, required this.backgroundColor, required this.colortext,required this.text});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      flex: 0,
      child: Container(
        width: 400,
        padding: EdgeInsets.symmetric(vertical: 20,horizontal: 40),
        child: FilledButton(
            onPressed: onPressed,
            style:  ButtonStyle(
              shape: MaterialStatePropertyAll(RoundedRectangleBorder(side: BorderSide(color: AppColor.color_primary),borderRadius: BorderRadius.circular(10),),),
              padding: MaterialStatePropertyAll(EdgeInsets.all(20)),
              backgroundColor: MaterialStatePropertyAll(backgroundColor),
            ),
            child: Text(text.tr,style: TextStyle(fontSize: 18,color: colortext),)
        ),
      ),
    );

  }
}
