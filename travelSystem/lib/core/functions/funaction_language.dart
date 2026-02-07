import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:travelsystem/core/constants/Color.dart';


import '../../shared/widgets/language_bottom_sheet.dart';
import '../localization/Changelocal.dart';

void openLangSheet() async {
  await Get.bottomSheet(
    LanguageBottomSheet(),
    backgroundColor: Colors.transparent,
    isScrollControlled: true,

  );
}