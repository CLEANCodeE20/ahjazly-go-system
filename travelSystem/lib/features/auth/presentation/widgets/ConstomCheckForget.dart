import 'package:flutter/material.dart';
import '../../../../core/constants/Color.dart';
import '../../../../core/constants/dimensions.dart';

class ConstomCheckForget extends StatelessWidget {
  final String nameimage;
  final String Text1;
  final String Text2;
  final String Text3;

  const ConstomCheckForget({
    Key? key,
    required this.nameimage,
    required this.Text1,
    required this.Text2,
    required this.Text3,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Image.asset(nameimage, height: 200),
        SizedBox(height: AppDimensions.paddingMedium),
        Text(Text1, style: TextStyle(fontSize: AppDimensions.fontSizeXXLarge, fontWeight: FontWeight.bold, color: AppColor.color_primary, fontFamily: 'Cairo')),
        SizedBox(height: AppDimensions.paddingSmall),
        Text(Text2, textAlign: TextAlign.center, style: TextStyle(fontSize: AppDimensions.fontSizeMedium, color: Colors.grey, fontFamily: 'Cairo')),
        if (Text3.isNotEmpty) ...[
          SizedBox(height: AppDimensions.paddingSmall),
          Text(Text3, textAlign: TextAlign.center, style: TextStyle(fontSize: AppDimensions.fontSizeMedium, color: Colors.grey, fontFamily: 'Cairo')),
        ],
      ],
    );
  }
}
