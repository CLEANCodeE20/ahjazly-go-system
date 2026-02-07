import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../../core/constants/Color.dart';

/// أنواع مؤشرات التحميل
enum LoadingType {
  /// دائري بسيط في المنتصف
  circular,
  /// شريط تقدم خطي
  linear,
  /// Shimmer effect للقوائم
  shimmer,
  /// مؤشر مخصص مع رسالة
  custom,
}

/// Widget موحد لعرض حالات التحميل
class LoadingWidget extends StatelessWidget {
  final LoadingType type;
  final String? message;
  final int shimmerItemCount;
  
  const LoadingWidget({
    Key? key,
    this.type = LoadingType.circular,
    this.message,
    this.shimmerItemCount = 5,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    switch (type) {
      case LoadingType.circular:
        return _buildCircular();
      case LoadingType.linear:
        return _buildLinear();
      case LoadingType.shimmer:
        return _buildShimmer();
      case LoadingType.custom:
        return _buildCustom();
    }
  }
  
  /// مؤشر دائري بسيط
  Widget _buildCircular() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          CircularProgressIndicator(
            valueColor: AlwaysStoppedAnimation<Color>(AppColor.primary),
          ),
          if (message != null) ...[
            const SizedBox(height: 16),
            Text(
              message!,
              style: TextStyle(
                color: Colors.grey[600],
                fontSize: 14,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ],
      ),
    );
  }
  
  /// شريط تقدم خطي
  Widget _buildLinear() {
    return LinearProgressIndicator(
      valueColor: AlwaysStoppedAnimation<Color>(AppColor.primary),
      backgroundColor: AppColor.primary.withOpacity(0.2),
    );
  }
  
  /// Shimmer effect للقوائم
  Widget _buildShimmer() {
    return Shimmer.fromColors(
      baseColor: Colors.grey[300]!,
      highlightColor: Colors.grey[100]!,
      child: ListView.builder(
        itemCount: shimmerItemCount,
        padding: const EdgeInsets.all(16),
        physics: const NeverScrollableScrollPhysics(),
        itemBuilder: (context, index) => Container(
          margin: const EdgeInsets.only(bottom: 12),
          height: 80,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
    );
  }
  
  /// مؤشر مخصص مع رسالة وتصميم احترافي
  Widget _buildCustom() {
    return Center(
      child: Container(
        padding: const EdgeInsets.all(24),
        margin: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 20,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 50,
              height: 50,
              child: CircularProgressIndicator(
                strokeWidth: 3,
                valueColor: AlwaysStoppedAnimation<Color>(AppColor.primary),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              message ?? 'جاري التحميل...',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Colors.grey[800],
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

/// Shimmer مخصص للبطاقات (Cards)
class ShimmerCard extends StatelessWidget {
  final double height;
  final double? width;
  final BorderRadius? borderRadius;
  
  const ShimmerCard({
    Key? key,
    this.height = 80,
    this.width,
    this.borderRadius,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: Colors.grey[300]!,
      highlightColor: Colors.grey[100]!,
      child: Container(
        height: height,
        width: width,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: borderRadius ?? BorderRadius.circular(12),
        ),
      ),
    );
  }
}

/// Shimmer للنصوص
class ShimmerText extends StatelessWidget {
  final double width;
  final double height;
  
  const ShimmerText({
    Key? key,
    this.width = 100,
    this.height = 16,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: Colors.grey[300]!,
      highlightColor: Colors.grey[100]!,
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(4),
        ),
      ),
    );
  }
}
