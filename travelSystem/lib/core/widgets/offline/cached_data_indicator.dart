import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/constants/Color.dart';

/// مؤشر بصري يظهر عندما يشاهد المستخدم بيانات مخزنة مؤقتاً
class CachedDataIndicator extends StatelessWidget {
  final DateTime lastUpdate;
  final VoidCallback? onRefresh;
  final bool showRefreshButton;

  const CachedDataIndicator({
    super.key,
    required this.lastUpdate,
    this.onRefresh,
    this.showRefreshButton = true,
  });

  String _getTimeAgo() {
    final now = DateTime.now();
    final difference = now.difference(lastUpdate);

    if (difference.inMinutes < 1) {
      return 'الآن';
    } else if (difference.inMinutes < 60) {
      return 'منذ ${difference.inMinutes} دقيقة';
    } else if (difference.inHours < 24) {
      return 'منذ ${difference.inHours} ساعة';
    } else {
      return 'منذ ${difference.inDays} يوم';
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: isDark 
            ? AppColor.primary.withOpacity(0.15) 
            : AppColor.primary.withOpacity(0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: AppColor.primary.withOpacity(0.3),
          width: 1,
        ),
      ),
      child: Row(
        children: [
          Icon(
            Icons.offline_bolt_rounded,
            size: 18,
            color: AppColor.primary,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'البيانات المعروضة محفوظة ${_getTimeAgo()}',
              style: TextStyle(
                fontFamily: 'Cairo',
                fontSize: 12,
                color: isDark ? Colors.white70 : AppColor.textPrimary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          if (showRefreshButton && onRefresh != null) ...[
            const SizedBox(width: 8),
            InkWell(
              onTap: onRefresh,
              borderRadius: BorderRadius.circular(8),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColor.primary,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.refresh_rounded,
                      size: 14,
                      color: Colors.white,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'تحديث',
                      style: TextStyle(
                        fontFamily: 'Cairo',
                        fontSize: 11,
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
