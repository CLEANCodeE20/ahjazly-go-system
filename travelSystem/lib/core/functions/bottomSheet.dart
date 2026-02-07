import 'dart:io';

import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../constants/Color.dart';

Future<bool>bottomSheet(){
   Get.bottomSheet(
       backgroundColor: Colors.transparent,
       isScrollControlled: true,
       barrierColor: AppColor.color_primary,
    Container(
      height: 50,
      child: Column(
        children: [
          Text("هل تريد الخروج من التطبيق"),

          Row(
            children: [
              ElevatedButton(
                onPressed: (){
                  Get.back();
                },
                child: Text('لا',style: TextStyle(color: AppColor.color_primary,fontWeight: FontWeight.w700),),
                style:  ButtonStyle(
                  shape: MaterialStatePropertyAll(RoundedRectangleBorder(borderRadius: BorderRadius.circular(10),side: BorderSide(color: AppColor.color_secondary))),
                  padding: MaterialStatePropertyAll(EdgeInsets.all(10)),
                  backgroundColor: MaterialStatePropertyAll(AppColor.color_secondary),
                ),
              ),
              ElevatedButton(
                onPressed: (){
                  exit(0);
                },
                child: Text('نعم'),
                style:  ButtonStyle(
                  shape: MaterialStatePropertyAll(RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
                  padding: MaterialStatePropertyAll(EdgeInsets.all(10)),
                  backgroundColor: MaterialStatePropertyAll(AppColor.color_primary),
                ),
              ),
            ],
          ),
        ],
      ),
    ),
  );
   return Future.value(true);
}