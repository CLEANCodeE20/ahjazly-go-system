import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../../../../core/constants/Color.dart';

class DynamicBackground extends StatefulWidget {
  final Widget child;
  const DynamicBackground({super.key, required this.child});

  @override
  State<DynamicBackground> createState() => _DynamicBackgroundState();
}

class _DynamicBackgroundState extends State<DynamicBackground> with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 10),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Stack(
      children: [
        // Base Gradient - Transitioning from Purple to Deep Indigo
        Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: isDark 
                ? [const Color(0xFF1E1B4B), const Color(0xFF0F172A)] // Deep Indigo to Midnight
                : [Colors.white, AppColor.primaryLighter.withOpacity(0.3)],
            ),
          ),
        ),
        
        // Animated Blobs
        AnimatedBuilder(
          animation: _controller,
          builder: (context, child) {
            return CustomPaint(
              painter: _BackgroundPainter(
                animationValue: _controller.value,
                isDark: isDark,
                primaryColor: AppColor.primary,
              ),
              size: Size.infinite,
            );
          },
        ),
        
        // Content
        widget.child,
      ],
    );
  }
}

class _BackgroundPainter extends CustomPainter {
  final double animationValue;
  final bool isDark;
  final Color primaryColor;

  _BackgroundPainter({
    required this.animationValue,
    required this.isDark,
    required this.primaryColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..maskFilter = const MaskFilter.blur(BlurStyle.normal, 60);
    
    // Blob 1: Primary Purple
    final center1 = Offset(
      size.width * (0.2 + 0.15 * math.sin(animationValue * 2 * math.pi)),
      size.height * (0.3 + 0.1 * math.cos(animationValue * 2 * math.pi)),
    );
    paint.color = primaryColor.withOpacity(isDark ? 0.08 : 0.12);
    canvas.drawCircle(center1, size.width * 0.5, paint);

    // Blob 2: Deep Indigo
    final center2 = Offset(
      size.width * (0.8 + 0.1 * math.cos(animationValue * 2 * math.pi)),
      size.height * (0.7 + 0.15 * math.sin(animationValue * 2 * math.pi)),
    );
    paint.color = const Color(0xFF4338CA).withOpacity(isDark ? 0.05 : 0.08); // Indigo
    canvas.drawCircle(center2, size.width * 0.6, paint);

    // Blob 3: Soft Cyan/Electric Blue for "Energy"
    final center3 = Offset(
      size.width * (0.5 + 0.2 * math.sin(animationValue * math.pi)),
      size.height * (0.5 + 0.2 * math.cos(animationValue * math.pi)),
    );
    paint.color = const Color(0xFF06B6D4).withOpacity(isDark ? 0.02 : 0.04); // Cyan
    canvas.drawCircle(center3, size.width * 0.4, paint);
  }

  @override
  bool shouldRepaint(covariant _BackgroundPainter oldDelegate) => 
    oldDelegate.animationValue != animationValue || oldDelegate.isDark != isDark;
}
