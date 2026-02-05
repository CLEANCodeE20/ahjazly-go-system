import 'package:flutter/material.dart';

import '../../../../shared/widgets/company_logo_widget.dart';

class FadeInLogoWidget extends StatelessWidget {
  final String imageUrl;
  final int duration;
  const FadeInLogoWidget({required this.imageUrl, this.duration = 400, super.key});

  @override
  Widget build(BuildContext context) {
    return AnimatedOpacity(
      opacity: 1,
      duration: Duration(milliseconds: duration),
      child: CompanyLogoWidget(imageUrl: imageUrl),
    );
  }
}