import 'package:flutter/material.dart';

// =============================================
// STAR RATING WIDGET
// مكون نجوم التقييم
// =============================================

class StarRatingWidget extends StatelessWidget {
  final int rating;
  final Function(int)? onRatingChanged;
  final double size;
  final Color activeColor;
  final Color inactiveColor;
  final bool readOnly;
  final MainAxisAlignment alignment;

  const StarRatingWidget({
    Key? key,
    required this.rating,
    this.onRatingChanged,
    this.size = 32.0,
    this.activeColor = const Color(0xFFFFA000),
    this.inactiveColor = const Color(0xFFE0E0E0),
    this.readOnly = false,
    this.alignment = MainAxisAlignment.start,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: alignment,
      mainAxisSize: MainAxisSize.min,
      children: List.generate(5, (index) {
        return GestureDetector(
          onTap: readOnly || onRatingChanged == null
              ? null
              : () => onRatingChanged!(index + 1),
          child: Padding(
            padding: EdgeInsets.symmetric(horizontal: size * 0.05),
            child: Icon(
              index < rating ? Icons.star : Icons.star_border,
              size: size,
              color: index < rating ? activeColor : inactiveColor,
            ),
          ),
        );
      }),
    );
  }
}

// =============================================
// ANIMATED STAR RATING WIDGET
// مكون نجوم التقييم المتحرك
// =============================================

class AnimatedStarRating extends StatefulWidget {
  final int rating;
  final Function(int)? onRatingChanged;
  final double size;
  final Color activeColor;
  final Color inactiveColor;
  final bool readOnly;

  const AnimatedStarRating({
    Key? key,
    required this.rating,
    this.onRatingChanged,
    this.size = 40.0,
    this.activeColor = const Color(0xFFFFA000),
    this.inactiveColor = const Color(0xFFE0E0E0),
    this.readOnly = false,
  }) : super(key: key);

  @override
  State<AnimatedStarRating> createState() => _AnimatedStarRatingState();
}

class _AnimatedStarRatingState extends State<AnimatedStarRating>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  int _hoveredStar = 0;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(5, (index) {
        final starIndex = index + 1;
        final isActive = starIndex <= widget.rating;
        final isHovered = starIndex <= _hoveredStar;

        return GestureDetector(
          onTap: widget.readOnly || widget.onRatingChanged == null
              ? null
              : () {
                  widget.onRatingChanged!(starIndex);
                  _controller.forward(from: 0);
                },
          child: MouseRegion(
            onEnter: widget.readOnly
                ? null
                : (_) => setState(() => _hoveredStar = starIndex),
            onExit: widget.readOnly
                ? null
                : (_) => setState(() => _hoveredStar = 0),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              // Reduced padding from size * 0.1 to size * 0.05 to prevent overflow
              padding: EdgeInsets.symmetric(horizontal: widget.size * 0.05),
              child: ScaleTransition(
                scale: Tween<double>(begin: 1.0, end: 1.2).animate(
                  CurvedAnimation(
                    parent: _controller,
                    curve: Curves.elasticOut,
                  ),
                ),
                child: Icon(
                  isActive || isHovered ? Icons.star : Icons.star_border,
                  size: widget.size,
                  color: isActive || isHovered
                      ? widget.activeColor
                      : widget.inactiveColor,
                ),
              ),
            ),
          ),
        );
      }),
    );
  }
}

// =============================================
// RATING DISPLAY WIDGET
// مكون عرض التقييم مع القيمة
// =============================================

class RatingDisplay extends StatelessWidget {
  final double rating;
  final int totalRatings;
  final double size;
  final bool showCount;
  final TextStyle? textStyle;

  const RatingDisplay({
    Key? key,
    required this.rating,
    this.totalRatings = 0,
    this.size = 20.0,
    this.showCount = true,
    this.textStyle,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(
          Icons.star,
          size: size,
          color: const Color(0xFFFFA000),
        ),
        SizedBox(width: size * 0.2),
        Text(
          rating.toStringAsFixed(1),
          style: textStyle ??
              TextStyle(
                fontSize: size * 0.8,
                fontWeight: FontWeight.bold,
                color: Colors.black87,
              ),
        ),
        if (showCount && totalRatings > 0) ...[
          SizedBox(width: size * 0.3),
          Text(
            '($totalRatings)',
            style: TextStyle(
              fontSize: size * 0.7,
              color: Colors.grey[600],
            ),
          ),
        ],
      ],
    );
  }
}

// =============================================
// RATING BAR WIDGET
// مكون شريط التقييم
// =============================================

class RatingBar extends StatelessWidget {
  final int stars;
  final int count;
  final int totalCount;
  final Color color;

  const RatingBar({
    Key? key,
    required this.stars,
    required this.count,
    required this.totalCount,
    this.color = const Color(0xFFFFA000),
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final percentage = totalCount > 0 ? (count / totalCount) : 0.0;

    return Row(
      children: [
        SizedBox(
          width: 60,
          child: Row(
            children: [
              Text(
                '$stars',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(width: 4),
              const Icon(
                Icons.star,
                size: 16,
                color: Color(0xFFFFA000),
              ),
            ],
          ),
        ),
        Expanded(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: percentage,
              backgroundColor: Colors.grey[200],
              valueColor: AlwaysStoppedAnimation<Color>(color),
              minHeight: 8,
            ),
          ),
        ),
        const SizedBox(width: 12),
        SizedBox(
          width: 40,
          child: Text(
            count.toString(),
            textAlign: TextAlign.end,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[600],
            ),
          ),
        ),
      ],
    );
  }
}
