/// استراتيجيات التخزين المؤقت المختلفة
enum CacheStrategy {
  /// Cache-First: عرض الكاش فوراً ثم التحديث في الخلفية
  /// مناسب للبيانات شبه الثابتة (FAQ, Policies, Banners)
  cacheFirst,

  /// Network-First: محاولة الشبكة أولاً، ثم الكاش عند الفشل
  /// مناسب للبيانات الحية (Trips, Bookings)
  networkFirst,

  /// Stale-While-Revalidate: عرض الكاش وتحديثه في الخلفية
  /// مناسب للبيانات المتوسطة (Profile, Support Tickets)
  staleWhileRevalidate,

  /// Network-Only: الشبكة فقط، بدون تخزين
  /// مناسب للعمليات الحرجة (Payment, Booking Creation)
  networkOnly,
}

/// إعدادات الكاش لكل نوع بيانات
class CacheConfig {
  final CacheStrategy strategy;
  final Duration maxAge;
  final bool showCacheIndicator;

  const CacheConfig({
    required this.strategy,
    required this.maxAge,
    this.showCacheIndicator = true,
  });

  // إعدادات جاهزة للاستخدام
  
  /// للبيانات شبه الثابتة (24 ساعة)
  static const staticData = CacheConfig(
    strategy: CacheStrategy.cacheFirst,
    maxAge: Duration(hours: 24),
    showCacheIndicator: true,
  );

  /// للبيانات المتوسطة (1 ساعة)
  static const mediumData = CacheConfig(
    strategy: CacheStrategy.staleWhileRevalidate,
    maxAge: Duration(hours: 1),
    showCacheIndicator: true,
  );

  /// للبيانات الحية (5 دقائق)
  static const liveData = CacheConfig(
    strategy: CacheStrategy.networkFirst,
    maxAge: Duration(minutes: 5),
    showCacheIndicator: true,
  );

  /// للعمليات الحرجة (بدون كاش)
  static const criticalOperations = CacheConfig(
    strategy: CacheStrategy.networkOnly,
    maxAge: Duration.zero,
    showCacheIndicator: false,
  );
}
