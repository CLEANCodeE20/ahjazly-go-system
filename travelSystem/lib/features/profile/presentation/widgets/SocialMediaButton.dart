import 'package:flutter/material.dart';

import '../../../../core/constants/dimensions.dart';


class SocialMediaButton extends StatefulWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback? onTap;

  const SocialMediaButton({
    Key? key,
    required this.icon,
    required this.label,
    required this.color,
    this.onTap,
  }) : super(key: key);

  @override
  State<SocialMediaButton> createState() => _SocialMediaButtonState();
}

class _SocialMediaButtonState extends State<SocialMediaButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  bool _isPressed = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: AppDimensions.animationDurationFast,
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.95).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) {
        setState(() => _isPressed = true);
        _controller.forward();
      },
      onTapUp: (_) {
        setState(() => _isPressed = false);
        _controller.reverse();
        if (widget.onTap != null) {
          widget.onTap!();
        }
      },
      onTapCancel: () {
        setState(() => _isPressed = false);
        _controller.reverse();
      },
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: AnimatedContainer(
          duration: AppDimensions.animationDurationFast,
          padding: EdgeInsets.symmetric(
            horizontal: AppDimensions.paddingMedium,
            vertical: AppDimensions.paddingSmall,
          ),
          decoration: BoxDecoration(
            color: _isPressed
                ? widget.color.withOpacity(0.9)
                : widget.color.withOpacity(0.15),
            borderRadius: BorderRadius.circular(AppDimensions.radiusXLarge),
            border: Border.all(
              color: widget.color.withOpacity(_isPressed ? 0.5 : 0.3),
              width: 1.5,
            ),
            boxShadow: _isPressed
                ? []
                : [
                    BoxShadow(
                      color: widget.color.withOpacity(0.2),
                      blurRadius: 8,
                      spreadRadius: 1,
                      offset: Offset(0, 3),
                    ),
                  ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                widget.icon,
                color: _isPressed ? Colors.white : widget.color,
                size: AppDimensions.iconSizeMedium,
              ),
              SizedBox(width: AppDimensions.spacingSmall),
              Text(
                widget.label,
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: AppDimensions.fontSizeMedium,
                  fontWeight: FontWeight.w600,
                  color: _isPressed ? Colors.white : widget.color,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
