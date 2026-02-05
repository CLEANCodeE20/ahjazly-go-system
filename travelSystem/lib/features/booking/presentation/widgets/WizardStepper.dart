import 'package:flutter/material.dart';
import 'dart:math' as math;

class WizardStepperHorizontal extends StatelessWidget {
  final int currentStep;
  final List<String> steps;
  final Color activeColor;
  final Color doneColor;
  final Color inactiveColor;

  const WizardStepperHorizontal({
    super.key,
    required this.currentStep,
    required this.steps,
    this.activeColor = const Color(0xff9D71BD), // AppColor.primary
    this.doneColor = const Color(0xff4CD964),
    this.inactiveColor = const Color(0xffCCCCCC),
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 90,
      child: Stack(
        children: [
          // Connecting Lines
          Positioned(
            top: 18,
            left: 40,
            right: 40,
            child: Row(
              children: List.generate(
                steps.length - 1,
                (index) => Expanded(
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 400),
                    height: 3,
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: index < currentStep
                            ? [doneColor, doneColor]
                            : [Theme.of(context).brightness == Brightness.dark ? Colors.white10 : inactiveColor, Theme.of(context).brightness == Brightness.dark ? Colors.white10 : inactiveColor],
                      ),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
              ),
            ),
          ),
          
          // Step Indicators
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: steps.asMap().entries.map((entry) {
              int idx = entry.key;
              String label = entry.value;
              bool isActive = idx == currentStep;
              bool isDone = idx < currentStep;

              return Expanded(
                child: _buildStepIndicator(
                  context: context,
                  index: idx,
                  label: label,
                  isActive: isActive,
                  isDone: isDone,
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildStepIndicator({
    required BuildContext context,
    required int index,
    required String label,
    required bool isActive,
    required bool isDone,
  }) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Circle with Icon/Number
        TweenAnimationBuilder<double>(
          duration: const Duration(milliseconds: 300),
          tween: Tween(begin: 0, end: 1),
          builder: (context, value, child) {
            return Transform.scale(
              scale: isActive ? 1.0 + (0.1 * value) : 1.0,
              child: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: isActive
                      ? activeColor
                      : (isDone ? doneColor : (Theme.of(context).brightness == Brightness.dark ? Colors.white.withOpacity(0.05) : Colors.white)),
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: isActive
                        ? activeColor
                        : (isDone ? doneColor : (Theme.of(context).brightness == Brightness.dark ? Colors.white10 : inactiveColor)),
                    width: isActive ? 3 : 2,
                  ),
                  boxShadow: isActive
                      ? [
                          BoxShadow(
                            color: activeColor.withOpacity(0.4),
                            blurRadius: 12,
                            spreadRadius: 2,
                          ),
                        ]
                      : isDone
                          ? [
                              BoxShadow(
                                color: doneColor.withOpacity(0.3),
                                blurRadius: 8,
                                spreadRadius: 1,
                              ),
                            ]
                          : [],
                ),
                child: Center(
                  child: AnimatedSwitcher(
                    duration: const Duration(milliseconds: 300),
                    transitionBuilder: (child, animation) {
                      return ScaleTransition(
                        scale: animation,
                        child: FadeTransition(
                          opacity: animation,
                          child: child,
                        ),
                      );
                    },
                    child: isDone
                        ? Icon(
                            Icons.check_rounded,
                            color: Colors.white,
                            size: 24,
                            key: ValueKey('check_$index'),
                          )
                        : Text(
                            "${index + 1}",
                            key: ValueKey('number_$index'),
                            style: TextStyle(
                              color: isActive ? Colors.white : (Theme.of(context).brightness == Brightness.dark ? Colors.white24 : inactiveColor),
                              fontWeight: FontWeight.bold,
                              fontSize: 18,
                              fontFamily: "Cairo",
                            ),
                          ),
                  ),
                ),
              ),
            );
          },
        ),
        
        const SizedBox(height: 8),
        
        // Label
        AnimatedDefaultTextStyle(
          duration: const Duration(milliseconds: 300),
          style: TextStyle(
            color: isActive
                ? activeColor
                : (isDone ? doneColor : (Theme.of(context).brightness == Brightness.dark ? Colors.white38 : inactiveColor)),
            fontWeight: isActive ? FontWeight.bold : FontWeight.w500,
            fontSize: isActive ? 13 : 12,
            fontFamily: "Cairo",
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}

// Alternative Vertical Stepper (for future use)
class WizardStepperVertical extends StatelessWidget {
  final int currentStep;
  final List<String> steps;
  final Color activeColor;
  final Color doneColor;
  final Color inactiveColor;

  const WizardStepperVertical({
    super.key,
    required this.currentStep,
    required this.steps,
    this.activeColor = const Color(0xff007AFF),
    this.doneColor = const Color(0xff4CD964),
    this.inactiveColor = const Color(0xffCCCCCC),
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: steps.asMap().entries.map((entry) {
        int idx = entry.key;
        String label = entry.value;
        bool isActive = idx == currentStep;
        bool isDone = idx < currentStep;
        bool isLast = idx == steps.length - 1;

        return IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Left side: Circle and Line
              Column(
                children: [
                  // Circle
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    width: isActive ? 44 : 36,
                    height: isActive ? 44 : 36,
                    decoration: BoxDecoration(
                      color: isActive
                          ? activeColor
                          : (isDone ? doneColor : Colors.white),
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: isActive
                            ? activeColor
                            : (isDone ? doneColor : inactiveColor),
                        width: 3,
                      ),
                      boxShadow: isActive
                          ? [
                              BoxShadow(
                                color: activeColor.withOpacity(0.3),
                                blurRadius: 10,
                                spreadRadius: 2,
                              ),
                            ]
                          : [],
                    ),
                    child: Center(
                      child: isDone
                          ? Icon(Icons.check, color: Colors.white, size: 22)
                          : Text(
                              "${idx + 1}",
                              style: TextStyle(
                                color: isActive ? Colors.white : inactiveColor,
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                    ),
                  ),
                  
                  // Connecting Line
                  if (!isLast)
                    Expanded(
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 400),
                        width: 3,
                        margin: const EdgeInsets.symmetric(vertical: 4),
                        decoration: BoxDecoration(
                          color: isDone ? doneColor : inactiveColor,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                ],
              ),
              
              const SizedBox(width: 16),
              
              // Right side: Label and Description
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(top: 8, bottom: 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        label,
                        style: TextStyle(
                          color: isActive
                              ? activeColor
                              : (isDone ? doneColor : inactiveColor),
                          fontWeight: isActive ? FontWeight.bold : FontWeight.w500,
                          fontSize: isActive ? 18 : 16,
                          fontFamily: "Cairo",
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}
