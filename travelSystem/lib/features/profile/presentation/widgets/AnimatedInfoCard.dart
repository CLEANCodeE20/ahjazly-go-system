import 'package:flutter/material.dart';

import '../../../../core/constants/Color.dart';
import '../../../../core/constants/dimensions.dart';



class AnimatedInfoCard extends StatelessWidget {
  final Widget child;
  final int index;
  final Animation<Offset> slideAnimation;
  final Animation<double> fadeAnimation;

  const AnimatedInfoCard({
    super.key,
    required this.child,
    required this.index,
    required this.slideAnimation,
    required this.fadeAnimation,
  });

  @override
  Widget build(BuildContext context) {
    return SlideTransition(
      position: slideAnimation,
      child: FadeTransition(
        opacity: fadeAnimation,
        child: Container(
          margin: EdgeInsets.symmetric(
            horizontal: AppDimensions.marginMedium,
            vertical: AppDimensions.marginSmall,
          ),
          padding: EdgeInsets.all(AppDimensions.paddingLarge),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(AppDimensions.radiusXLarge),
            boxShadow: [
              BoxShadow(
                color: AppColor.primary.withOpacity(0.08),
                blurRadius: 20,
                spreadRadius: 2,
                offset: Offset(0, 4),
              ),
            ],
          ),
          child: child,
        ),
      ),
    );
  }
}
