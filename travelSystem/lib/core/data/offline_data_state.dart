/// حالة البيانات - توضح ما إذا كانت البيانات من الكاش أو من الخادم
class DataState<T> {
  final T data;
  final bool isFromCache;
  final DateTime? lastUpdate;
  final bool isRefreshing;

  const DataState({
    required this.data,
    this.isFromCache = false,
    this.lastUpdate,
    this.isRefreshing = false,
  });

  /// إنشاء حالة بيانات من الكاش
  factory DataState.fromCache(T data, DateTime lastUpdate) {
    return DataState(
      data: data,
      isFromCache: true,
      lastUpdate: lastUpdate,
      isRefreshing: false,
    );
  }

  /// إنشاء حالة بيانات من الخادم
  factory DataState.fromServer(T data) {
    return DataState(
      data: data,
      isFromCache: false,
      lastUpdate: DateTime.now(),
      isRefreshing: false,
    );
  }

  /// إنشاء حالة بيانات قيد التحديث
  DataState<T> copyWithRefreshing(bool refreshing) {
    return DataState(
      data: data,
      isFromCache: isFromCache,
      lastUpdate: lastUpdate,
      isRefreshing: refreshing,
    );
  }

  /// الحصول على عمر البيانات بالدقائق
  int? get ageInMinutes {
    if (lastUpdate == null) return null;
    return DateTime.now().difference(lastUpdate!).inMinutes;
  }

  /// التحقق من انتهاء صلاحية البيانات
  bool isExpired(Duration maxAge) {
    if (lastUpdate == null) return true;
    return DateTime.now().difference(lastUpdate!) > maxAge;
  }
}
