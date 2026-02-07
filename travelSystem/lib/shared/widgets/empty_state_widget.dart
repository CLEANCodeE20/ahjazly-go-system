import 'package:flutter/material.dart';
import '../../core/constants/Color.dart';
import '../../core/constants/dimensions.dart';

/// Widget لعرض حالة فارغة مع رسالة وإجراء اختياري
class EmptyStateWidget extends StatelessWidget {
  final String title;
  final String? subtitle;
  final IconData icon;
  final String? actionLabel;
  final VoidCallback? onAction;
  final Widget? customWidget;
  final Color? iconColor;
  
  const EmptyStateWidget({
    Key? key,
    required this.title,
    this.subtitle,
    this.icon = Icons.inbox_outlined,
    this.actionLabel,
    this.onAction,
    this.customWidget,
    this.iconColor,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: EdgeInsets.all(AppDimensions.paddingLarge),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Custom widget أو أيقونة
            if (customWidget != null)
              customWidget!
            else
              _buildIconContainer(),
            
            SizedBox(height: 24),
            
            // العنوان
            Text(
              title,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.grey[800],
              ),
              textAlign: TextAlign.center,
            ),
            
            // النص الفرعي
            if (subtitle != null) ...[
              SizedBox(height: 8),
              Text(
                subtitle!,
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[600],
                ),
                textAlign: TextAlign.center,
              ),
            ],
            
            // زر الإجراء
            if (actionLabel != null && onAction != null) ...[
              SizedBox(height: 24),
              _buildActionButton(),
            ],
          ],
        ),
      ),
    );
  }
  
  Widget _buildIconContainer() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: (iconColor ?? AppColor.primary).withOpacity(0.1),
        shape: BoxShape.circle,
      ),
      child: Icon(
        icon,
        size: 64,
        color: iconColor ?? AppColor.primary,
      ),
    );
  }
  
  Widget _buildActionButton() {
    return ElevatedButton.icon(
      onPressed: onAction,
      icon: const Icon(Icons.refresh),
      label: Text(actionLabel!),
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColor.primary,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(
          horizontal: 24,
          vertical: 12,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        elevation: 2,
      ),
    );
  }
}

/// Empty state للبحث
class SearchEmptyState extends EmptyStateWidget {
  SearchEmptyState({
    Key? key,
    String? searchQuery,
    VoidCallback? onClearSearch,
  }) : super(
          key: key,
          title: 'لم يتم العثور على نتائج',
          subtitle: searchQuery != null 
              ? 'لم نتمكن من العثور على نتائج لـ "$searchQuery"'
              : 'حاول البحث بكلمات مختلفة',
          icon: Icons.search_off,
          actionLabel: onClearSearch != null ? 'مسح البحث' : null,
          onAction: onClearSearch,
        );
}

/// Empty state للحجوزات
class BookingsEmptyState extends EmptyStateWidget {
  BookingsEmptyState({
    Key? key,
    required VoidCallback onStartBooking,
  }) : super(
          key: key,
          title: 'لا توجد حجوزات',
          subtitle: 'لم تقم بإجراء أي حجوزات بعد',
          icon: Icons.calendar_today_outlined,
          actionLabel: 'ابدأ الحجز',
          onAction: onStartBooking,
        );
}

/// Empty state للإشعارات
class NotificationsEmptyState extends EmptyStateWidget {
  NotificationsEmptyState({
    Key? key,
  }) : super(
          key: key,
          title: 'لا توجد إشعارات',
          subtitle: 'سنعلمك عندما يحدث شيء جديد',
          icon: Icons.notifications_none,
        );
}

/// Empty state لفشل التحميل مع إعادة محاولة
class ErrorState extends EmptyStateWidget {
  ErrorState({
    Key? key,
    String? errorMessage,
    required VoidCallback onRetry,
  }) : super(
          key: key,
          title: 'حدث خطأ',
          subtitle: errorMessage ?? 'تعذر تحميل البيانات',
          icon: Icons.error_outline,
          iconColor: Colors.red,
          actionLabel: 'إعادة المحاولة',
          onAction: onRetry,
        );
}

/// Empty state لعدم توفر الاتصال بالإنترنت
class NoInternetState extends EmptyStateWidget {
  NoInternetState({
    Key? key,
    required VoidCallback onRetry,
  }) : super(
          key: key,
          title: 'لا يوجد اتصال بالإنترنت',
          subtitle: 'تحقق من اتصالك وحاول مرة أخرى',
          icon: Icons.wifi_off,
          iconColor: Colors.orange,
          actionLabel: 'إعادة المحاولة',
          onAction: onRetry,
        );
}
