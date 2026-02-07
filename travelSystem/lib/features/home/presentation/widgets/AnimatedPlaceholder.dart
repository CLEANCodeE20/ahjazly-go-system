import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';
import '../../../../core/constants/Color.dart';
import '../../../../core/constants/dimensions.dart';
import '../../../../core/constants/animations.dart';

class AnimatedPlaceholder extends StatelessWidget {
  final double height;
  final String text;
  final String? lottieUrl;

  const AnimatedPlaceholder({
    super.key,
    required this.height,
    required this.text,
    this.lottieUrl,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: height,
      width: double.infinity,
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(AppDimensions.radiusXXLarge),
        border: Border.all(color: Theme.of(context).colorScheme.outline.withOpacity(0.1)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(Theme.of(context).brightness == Brightness.dark ? 0.2 : 0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              height: height * 0.5,
              child: Lottie.network(
                lottieUrl ?? AppAnimations.loadingBus,
                fit: BoxFit.contain,
                errorBuilder: (context, error, stackTrace) =>
                    CircularProgressIndicator(color: AppColor.color_primary),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              text,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}
