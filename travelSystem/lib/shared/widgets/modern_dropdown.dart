import 'package:flutter/material.dart';
import 'dart:ui';
import '../../../core/constants/Color.dart';
import '../../../core/constants/dimensions.dart';

/// Modern Dropdown with Glassmorphism Effect
class ModernDropdown<T> extends StatefulWidget {
  final T? value;
  final List<T> items;
  final ValueChanged<T?> onChanged;
  final String label;
  final IconData icon;
  final String? hint;
  final bool enabled;
  final String? Function(T?)? validator;
  final List<T> Function(T)? excludeItems;

  const ModernDropdown({
    Key? key,
    required this.value,
    required this.items,
    required this.onChanged,
    required this.label,
    required this.icon,
    this.hint,
    this.enabled = true,
    this.validator,
    this.excludeItems,
  }) : super(key: key);

  @override
  State<ModernDropdown<T>> createState() => _ModernDropdownState<T>();
}

class _ModernDropdownState<T> extends State<ModernDropdown<T>>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  late Animation<double> _glowAnimation;
  bool _isFocused = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );

    _scaleAnimation = Tween<double>(begin: 1.0, end: 1.02).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );

    _glowAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _onFocusChange(bool focused) {
    setState(() => _isFocused = focused);
    if (focused) {
      _controller.forward();
    } else {
      _controller.reverse();
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    // Filter items if excludeItems is provided
    final availableItems = widget.excludeItems != null && widget.value != null
        ? widget.items.where((item) {
            final excluded = widget.excludeItems!(widget.value as T);
            return !excluded.contains(item);
          }).toList()
        : widget.items;

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Transform.scale(
          scale: _scaleAnimation.value,
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(AppDimensions.radiusLarge),
              boxShadow: [
                BoxShadow(
                  color: AppColor.primary.withOpacity(0.1 * _glowAnimation.value),
                  blurRadius: 20 * _glowAnimation.value,
                  spreadRadius: 2 * _glowAnimation.value,
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(AppDimensions.radiusLarge),
              child: BackdropFilter(
                filter: ImageFilter.blur(
                  sigmaX: 10 * _glowAnimation.value,
                  sigmaY: 10 * _glowAnimation.value,
                ),
                child: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: _isFocused
                          ? [
                              AppColor.primary.withOpacity(0.1),
                              AppColor.primary.withOpacity(0.05),
                            ]
                          : [
                              isDark
                                  ? Colors.white.withOpacity(0.05)
                                  : AppColor.primaryLighter,
                              isDark
                                  ? Colors.white.withOpacity(0.02)
                                  : AppColor.primaryLighter,
                            ],
                    ),
                    border: Border.all(
                      color: _isFocused
                          ? AppColor.primary.withOpacity(0.5)
                          : AppColor.primary.withOpacity(0.2),
                      width: _isFocused ? 2 : 1,
                    ),
                    borderRadius: BorderRadius.circular(AppDimensions.radiusLarge),
                  ),
                  child: DropdownButtonFormField<T>(
                    value: widget.value,
                    items: availableItems.map((item) {
                      return DropdownMenuItem<T>(
                        value: item,
                        child: _buildDropdownItem(item),
                      );
                    }).toList(),
                    onChanged: widget.enabled ? widget.onChanged : null,
                    validator: widget.validator,
                    decoration: InputDecoration(
                      labelText: widget.label,
                      hintText: widget.hint,
                      labelStyle: TextStyle(
                        color: _isFocused 
                            ? AppColor.primary 
                            : (isDark ? Colors.white70 : AppColor.textSecondary),
                        fontWeight: FontWeight.w700,
                        fontFamily: "Cairo",
                      ),
                      hintStyle: TextStyle(
                        color: isDark ? Colors.white38 : AppColor.textSecondary.withOpacity(0.5),
                        fontFamily: "Cairo",
                      ),
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                      errorBorder: InputBorder.none,
                      filled: false,
                      prefixIcon: _buildPrefixIcon(),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: AppDimensions.paddingMedium,
                        vertical: AppDimensions.paddingSmall,
                      ),
                    ),
                    dropdownColor: isDark ? const Color(0xFF1E1B4B) : Colors.white,
                    icon: Icon(
                      Icons.keyboard_arrow_down_rounded,
                      color: _isFocused 
                          ? AppColor.primary 
                          : (isDark ? Colors.white70 : AppColor.textSecondary),
                    ),
                    isExpanded: true,
                    onTap: () => _onFocusChange(true),
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildPrefixIcon() {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      margin: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: _isFocused
            ? AppColor.primary.withOpacity(0.15)
            : AppColor.primary.withOpacity(0.08),
        borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
      ),
      child: Icon(
        widget.icon,
        color: AppColor.primary,
        size: AppDimensions.iconSizeMedium,
      ),
    );
  }

  Widget _buildDropdownItem(T item) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Expanded(
            child: Text(
              item.toString(),
              textAlign: TextAlign.right,
              style: const TextStyle(
                fontSize: AppDimensions.fontSizeLarge,
                fontFamily: "Cairo",
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// City Swap Button with Animation
class CitySwapButton extends StatefulWidget {
  final VoidCallback onTap;

  const CitySwapButton({
    Key? key,
    required this.onTap,
  }) : super(key: key);

  @override
  State<CitySwapButton> createState() => _CitySwapButtonState();
}

class _CitySwapButtonState extends State<CitySwapButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _rotationAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 500),
      vsync: this,
    );

    _rotationAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _controller, curve: Curves.elasticOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _handleTap() {
    _controller.forward(from: 0);
    widget.onTap();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Transform.rotate(
          angle: _rotationAnimation.value * 3.14159, // 180 degrees
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: _handleTap,
              borderRadius: BorderRadius.circular(50),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColor.primary.withOpacity(0.1),
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: AppColor.primary.withOpacity(0.3),
                    width: 2,
                  ),
                ),
                child: Icon(
                  Icons.swap_vert_rounded,
                  color: AppColor.primary,
                  size: 28,
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
