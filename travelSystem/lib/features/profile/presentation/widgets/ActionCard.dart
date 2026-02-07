import 'package:flutter/material.dart';
import 'package:get/get.dart';


import 'package:travelsystem/features/home/data/models/HomeAction.dart';

import '../../../../core/constants/Color.dart';
import '../../../../core/constants/dimensions.dart';

class ActionCard extends StatefulWidget {
  final HomeAction action;
  final bool isFullWidth;

  const ActionCard({required this.action, this.isFullWidth = false});

  @override
  State<ActionCard> createState() => _ActionCardState();
}

class _ActionCardState extends State<ActionCard> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 100),
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.96).animate(
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
    final card = Container(
      margin: EdgeInsets.only(bottom: AppDimensions.spacingSmall),
      width: widget.isFullWidth
          ? double.infinity
          : (MediaQuery.of(context).size.width -
                  (AppDimensions.paddingMedium * 2) -
                  AppDimensions.spacingSmall) /
              2,
      padding: EdgeInsets.all(AppDimensions.paddingMedium),
      decoration: BoxDecoration(
        color: Theme.of(context).brightness == Brightness.dark 
            ? const Color(0xFF1E293B) 
            : widget.action.background,
        borderRadius: BorderRadius.circular(AppDimensions.radiusLarge),
        border: Border.all(
          color: Theme.of(context).colorScheme.outline.withOpacity(0.1),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(Theme.of(context).brightness == Brightness.dark ? 0.2 : 0.04),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: EdgeInsets.all(AppDimensions.paddingSmall),
            decoration: BoxDecoration(
              color: Theme.of(context).brightness == Brightness.dark 
                  ? Colors.white.withOpacity(0.05) 
                  : Theme.of(context).colorScheme.surface,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 12,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Icon(
              widget.action.icon,
              color: Theme.of(context).brightness == Brightness.dark ? Colors.white : AppColor.primary,
            ),
          ),
          SizedBox(height: AppDimensions.spacingSmall),
          Text(
            widget.action.title.tr,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontSize: 18,
                ),
          ),
          SizedBox(height: AppDimensions.spacingXSmall),
          Text(
            widget.action.subtitle.tr,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ],
      ),
    );

    return GestureDetector(
      onTapDown: (_) => _controller.forward(),
      onTapUp: (_) {
        _controller.reverse();
        widget.action.onTap();
      },
      onTapCancel: () => _controller.reverse(),
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: card,
      ),
    );
  }
}
