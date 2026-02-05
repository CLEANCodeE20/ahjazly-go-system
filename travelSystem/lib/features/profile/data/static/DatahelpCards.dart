import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:path/path.dart';


import 'package:travelsystem/features/home/data/models/HomeAction.dart';

import '../../../../core/constants/nameRoute.dart';

List<HomeAction> helpCards = [
  HomeAction(
    icon: Icons.question_answer,
    title: 'الأسئلة الشائعة',
    subtitle: 'أجوبة جاهزة وسريعة',
    background: Colors.white,
    onTap: () => Get.toNamed(AppRoute.SupportAndHelp),
  ),
  /*HomeAction(
    icon: Icons.logout_rounded,
    title: 'تسجيل الخروج',
    subtitle: 'تسجيل خروج آمن',
    background: Colors.white,
    onTap: () => showLogoutDialog(context),
  ),*/
];