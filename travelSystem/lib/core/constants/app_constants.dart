/// ثوابت التطبيق
class AppConstants {
  // منع إنشاء instance من الكلاس
  AppConstants._();
  
  // ============ البيانات الجغرافية ============
  
  /// قائمة المدن المتاحة
  static const List<String> cities = [
    'صنعاء',
    'عدن',
    'تعز',
    'الحديدة',
    'إب',
    'الرياض',
    'مكه',
  ];
  
  // ============ أنواع الرحلات ============
  
  /// أنواع الرحلات المتاحة
  static const List<String> tripTypes = ['vip', 'عادي'];
  
  // ============ طرق الدفع ============
  
  /// طرق الدفع المتاحة
  static const List<String> paymentMethods = [
    'Cash',
    'Card',
    'Online',
  ];
  
  // ============ حالات الحجز ============
  
  /// حالات الحجز الممكنة
  static const List<String> bookingStatuses = [
    'Pending',
    'Confirmed',
    'Cancelled',
    'Completed',
  ];
  
  /// حالات الدفع الممكنة
  static const List<String> paymentStatuses = [
    'Unpaid',
    'Paid',
    'Refunded',
  ];
  
  // ============ قيود الركاب ============
  
  /// الحد الأقصى لعدد الركاب في الحجز الواحد
  static const int maxPassengers = 10;
  
  /// الحد الأدنى لعدد الركاب
  static const int minPassengers = 1;
  
  /// عدد المقاعد في الحافلة
  static const int seatsPerBus = 32;
  
  // ============ إعدادات الشبكة ============
  
  /// مهلة طلبات API
  static const Duration apiTimeout = Duration(seconds: 15);
  
  /// مهلة الاتصال
  static const Duration connectionTimeout = Duration(seconds: 15);
  
  /// مهلة استقبال البيانات
  static const Duration receiveTimeout = Duration(seconds: 15);
  
  // ============ إعدادات الكاش ============
  
  /// مدة صلاحية الكاش الافتراضية
  static const Duration cacheExpiration = Duration(hours: 24);
  
  /// مدة صلاحية كاش قائمة الرحلات
  static const Duration tripsCacheExpiration = Duration(hours: 1);
  
  /// مدة صلاحية كاش بيانات المستخدم
  static const Duration userCacheExpiration = Duration(days: 7);
  
  // ============ إعدادات البحث ============
  
  /// مدة التأخير لـ debouncing
  static const Duration debounceDelay = Duration(milliseconds: 500);
  
  /// الحد الأدنى لطول نص البحث
  static const int minSearchLength = 2;
  
  // ============ إعدادات الصور ============
  
  /// الحد الأقصى لحجم الصورة بالكيلوبايت
  static const int maxImageSizeKB = 500;
  
  /// جودة ضغط الصورة (0-100)
  static const int imageQuality = 85;
  
  /// أقصى عرض للصورة بالبكسل
  static const int maxImageWidth = 800;
  
  /// أقصى ارتفاع للصورة بالبكسل
  static const int maxImageHeight = 800;
  
  // ============ إعدادات الإشعارات ============
  
  /// مدة عرض Snackbar للأخطاء
  static const Duration errorSnackbarDuration = Duration(seconds: 3);
  
  /// مدة عرض Snackbar للنجاح
  static const Duration successSnackbarDuration = Duration(seconds: 2);
  
  /// مدة عرض Snackbar للمعلومات
  static const Duration infoSnackbarDuration = Duration(seconds: 2);
  
  // ============ إعدادات التحديث ============
  
  /// تردد التحقق من التحديثات (للبيانات التي تتطلب تحديث دوري)
  static const Duration refreshInterval = Duration(minutes: 5);
  
  /// مدة انتظار إعادة المحاولة عند الفشل
  static const Duration retryDelay = Duration(seconds: 3);
  
  /// عدد مرات إعادة المحاولة
  static const int maxRetryAttempts = 3;
  
  // ============ إعدادات الواجهة ============
  
  /// عدد العناصر في صفحة واحدة (Pagination)
  static const int itemsPerPage = 20;
  
  /// مدة الانتقالات المتحركة
  static const Duration animationDuration = Duration(milliseconds: 300);
  
  // ============ رموز الأخطاء ============
  
  /// رمز خطأ غير معروف
  static const String errorUnknown = 'ERROR_UNKNOWN';
  
  /// رمز خطأ الشبكة
  static const String errorNetwork = 'ERROR_NETWORK';
  
  /// رمز خطأ الخادم
  static const String errorServer = 'ERROR_SERVER';
  
  /// رمز خطأ المصادقة
  static const String errorAuth = 'ERROR_AUTH';
  
  /// رمز خطأ التحقق
  static const String errorValidation = 'ERROR_VALIDATION';
  
  // ============ مفاتيح التخزين المحلي ============
  
  /// مفتاح تخزين بيانات المستخدم
  static const String keyUserData = 'user_data';
  
  /// مفتاح تخزين التوكن
  static const String keyAuthToken = 'auth_token';
  
  /// مفتاح تخزين اللغة
  static const String keyLanguage = 'language';
  
  /// مفتاح تخزين الثيم
  static const String keyTheme = 'theme';
  
  /// مفتاح تخزين آخر تحديث
  static const String keyLastUpdate = 'last_update';
}
