import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';
import 'dart:convert';

/// خدمة التخزين المؤقت (Caching Service)
class CacheService extends GetxService {
  late GetStorage _storage;
  
  /// تهيئة الخدمة
  Future<CacheService> init() async {
    _storage = GetStorage();
    return this;
  }
  
  /// حفظ بيانات في الكاش مع صلاحية اختيارية
  Future<void> save<T>(
    String key, 
    T data, {
    Duration? expiration,
  }) async {
    final cacheData = {
      'data': data,
      'timestamp': DateTime.now().millisecondsSinceEpoch,
      'expiration': expiration?.inMilliseconds,
    };
    
    await _storage.write(key, jsonEncode(cacheData));
  }
  
  /// قراءة بيانات من الكاش مع التحقق من الصلاحية
  T? read<T>(String key) {
    final cached = _storage.read(key);
    if (cached == null) return null;
    
    try {
      final cacheData = jsonDecode(cached);
      final timestamp = cacheData['timestamp'] as int;
      final expiration = cacheData['expiration'] as int?;
      
      // تحقق من انتهاء الصلاحية
      if (expiration != null) {
        final age = DateTime.now().millisecondsSinceEpoch - timestamp;
        if (age > expiration) {
          remove(key); // حذف البيانات منتهية الصلاحية
          return null;
        }
      }
      
      return cacheData['data'] as T;
    } catch (e) {
      // في حالة خطأ في فك التشفير، حذف البيانات
      remove(key);
      return null;
    }
  }
  
  /// حذف بيانات معينة من الكاش
  Future<void> remove(String key) async {
    await _storage.remove(key);
  }
  
  /// مسح كل الكاش
  Future<void> clearAll() async {
    await _storage.erase();
  }
  
  /// فحص وجود بيانات في الكاش
  bool has(String key) {
    return _storage.hasData(key);
  }
  
  /// قراءة بيانات مع fallback للقيمة الافتراضية
  T readWithDefault<T>(String key, T defaultValue) {
    final value = read<T>(key);
    return value ?? defaultValue;
  }
  
  /// حفظ قائمة من البيانات
  Future<void> saveList<T>(
    String key,
    List<T> items, {
    Duration? expiration,
  }) async {
    await save(key, items, expiration: expiration);
  }
  
  /// قراءة قائمة من البيانات
  List<T>? readList<T>(String key) {
    final data = read<List>(key);
    if (data == null) return null;
    return data.cast<T>();
  }
  
  /// حفظ خريطة من البيانات
  Future<void> saveMap<K, V>(
    String key,
    Map<K, V> map, {
    Duration? expiration,
  }) async {
    await save(key, map, expiration: expiration);
  }
  
  /// قراءة خريطة من البيانات
  Map<K, V>? readMap<K, V>(String key) {
    final data = read<Map>(key);
    if (data == null) return null;
    return data.cast<K, V>();
  }
  
  /// الحصول على وقت آخر تحديث للبيانات
  DateTime? getLastUpdateTime(String key) {
    final cached = _storage.read(key);
    if (cached == null) return null;
    
    try {
      final cacheData = jsonDecode(cached);
      final timestamp = cacheData['timestamp'] as int;
      return DateTime.fromMillisecondsSinceEpoch(timestamp);
    } catch (e) {
      return null;
    }
  }
  
  /// فحص ما إذا كانت البيانات منتهية الصلاحية
  bool isExpired(String key) {
    final cached = _storage.read(key);
    if (cached == null) return true;
    
    try {
      final cacheData = jsonDecode(cached);
      final timestamp = cacheData['timestamp'] as int;
      final expiration = cacheData['expiration'] as int?;
      
      if (expiration == null) return false; // لا توجد صلاحية محددة
      
      final age = DateTime.now().millisecondsSinceEpoch - timestamp;
      return age > expiration;
    } catch (e) {
      return true;
    }
  }
}
