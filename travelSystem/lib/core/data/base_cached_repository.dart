import 'dart:convert';
import 'package:dartz/dartz.dart';
import '../error/failures.dart';
import '../network/network_info.dart';
import '../services/cache_service.dart';
import 'cache_strategy.dart';
import 'offline_data_state.dart';

/// Base Repository مع دعم التخزين المؤقت الذكي
/// يوفر وظائف مشتركة لجميع الـ Repositories
abstract class BaseCachedRepository {
  final CacheService cacheService;
  final NetworkInfo networkInfo;

  BaseCachedRepository({
    required this.cacheService,
    required this.networkInfo,
  });

  /// جلب البيانات مع دعم استراتيجيات الكاش المختلفة
  Future<Either<Failure, DataState<T>>> getCachedData<T>({
    required String cacheKey,
    required Future<T> Function() fetchFromRemote,
    required T Function(dynamic) fromJson,
    required dynamic Function(T) toJson,
    CacheConfig config = CacheConfig.mediumData,
  }) async {
    switch (config.strategy) {
      case CacheStrategy.cacheFirst:
        return _cacheFirstStrategy(
          cacheKey: cacheKey,
          fetchFromRemote: fetchFromRemote,
          fromJson: fromJson,
          toJson: toJson,
          config: config,
        );

      case CacheStrategy.networkFirst:
        return _networkFirstStrategy(
          cacheKey: cacheKey,
          fetchFromRemote: fetchFromRemote,
          fromJson: fromJson,
          toJson: toJson,
          config: config,
        );

      case CacheStrategy.staleWhileRevalidate:
        return _staleWhileRevalidateStrategy(
          cacheKey: cacheKey,
          fetchFromRemote: fetchFromRemote,
          fromJson: fromJson,
          toJson: toJson,
          config: config,
        );

      case CacheStrategy.networkOnly:
        return _networkOnlyStrategy(
          fetchFromRemote: fetchFromRemote,
        );
    }
  }

  /// استراتيجية Cache-First: عرض الكاش فوراً ثم التحديث في الخلفية
  Future<Either<Failure, DataState<T>>> _cacheFirstStrategy<T>({
    required String cacheKey,
    required Future<T> Function() fetchFromRemote,
    required T Function(dynamic) fromJson,
    required dynamic Function(T) toJson,
    required CacheConfig config,
  }) async {
    // 1. محاولة قراءة من الكاش أولاً
    final cachedData = _readFromCache<T>(cacheKey, fromJson);
    final lastUpdate = cacheService.getLastUpdateTime(cacheKey);

    // 2. إذا وجدنا بيانات في الكاش وليست منتهية الصلاحية
    if (cachedData != null && lastUpdate != null) {
      final age = DateTime.now().difference(lastUpdate);
      
      if (age <= config.maxAge) {
        // البيانات صالحة، نرجعها فوراً
        final dataState = DataState.fromCache(cachedData, lastUpdate);
        
        // تحديث في الخلفية (بدون انتظار)
        _updateInBackground(
          cacheKey: cacheKey,
          fetchFromRemote: fetchFromRemote,
          toJson: toJson,
          config: config,
        );
        
        return Right(dataState);
      }
    }

    // 3. لا توجد بيانات صالحة في الكاش، نجلب من الخادم
    return _fetchAndCache(
      cacheKey: cacheKey,
      fetchFromRemote: fetchFromRemote,
      toJson: toJson,
      config: config,
    );
  }

  /// استراتيجية Network-First: محاولة الشبكة أولاً ثم الكاش عند الفشل
  Future<Either<Failure, DataState<T>>> _networkFirstStrategy<T>({
    required String cacheKey,
    required Future<T> Function() fetchFromRemote,
    required T Function(dynamic) fromJson,
    required dynamic Function(T) toJson,
    required CacheConfig config,
  }) async {
    // 1. محاولة جلب من الخادم أولاً
    if (await networkInfo.isConnected) {
      final result = await _fetchAndCache(
        cacheKey: cacheKey,
        fetchFromRemote: fetchFromRemote,
        toJson: toJson,
        config: config,
      );
      
      // إذا نجحت، نرجع البيانات الجديدة
      if (result.isRight()) {
        return result;
      }
    }

    // 2. فشل الاتصال أو لا يوجد إنترنت، نحاول الكاش
    final cachedData = _readFromCache<T>(cacheKey, fromJson);
    final lastUpdate = cacheService.getLastUpdateTime(cacheKey);

    if (cachedData != null && lastUpdate != null) {
      print('⚠️ Using cached data as fallback for $cacheKey');
      return Right(DataState.fromCache(cachedData, lastUpdate));
    }

    // 3. لا توجد بيانات في الكاش أيضاً
    return const Left(OfflineFailure('لا يوجد اتصال بالإنترنت ولا توجد بيانات محفوظة'));
  }

  /// استراتيجية Stale-While-Revalidate: عرض الكاش وتحديثه في الخلفية
  Future<Either<Failure, DataState<T>>> _staleWhileRevalidateStrategy<T>({
    required String cacheKey,
    required Future<T> Function() fetchFromRemote,
    required T Function(dynamic) fromJson,
    required dynamic Function(T) toJson,
    required CacheConfig config,
  }) async {
    // 1. قراءة من الكاش
    final cachedData = _readFromCache<T>(cacheKey, fromJson);
    final lastUpdate = cacheService.getLastUpdateTime(cacheKey);

    // 2. إذا وجدنا بيانات، نرجعها فوراً ونحدث في الخلفية
    if (cachedData != null && lastUpdate != null) {
      // تحديث في الخلفية دائماً
      _updateInBackground(
        cacheKey: cacheKey,
        fetchFromRemote: fetchFromRemote,
        toJson: toJson,
        config: config,
      );
      
      return Right(DataState.fromCache(cachedData, lastUpdate));
    }

    // 3. لا توجد بيانات في الكاش، نجلب من الخادم
    return _fetchAndCache(
      cacheKey: cacheKey,
      fetchFromRemote: fetchFromRemote,
      toJson: toJson,
      config: config,
    );
  }

  /// استراتيجية Network-Only: الشبكة فقط بدون تخزين
  Future<Either<Failure, DataState<T>>> _networkOnlyStrategy<T>({
    required Future<T> Function() fetchFromRemote,
  }) async {
    if (!await networkInfo.isConnected) {
      return const Left(OfflineFailure('يتطلب هذا الإجراء اتصالاً بالإنترنت'));
    }

    try {
      final data = await fetchFromRemote();
      return Right(DataState.fromServer(data));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  /// جلب البيانات من الخادم وحفظها في الكاش
  Future<Either<Failure, DataState<T>>> _fetchAndCache<T>({
    required String cacheKey,
    required Future<T> Function() fetchFromRemote,
    required dynamic Function(T) toJson,
    required CacheConfig config,
  }) async {
    if (!await networkInfo.isConnected) {
      return const Left(OfflineFailure('لا يوجد اتصال بالإنترنت'));
    }

    try {
      final data = await fetchFromRemote();
      
      // حفظ في الكاش
      await _saveToCache(cacheKey, data, toJson, config.maxAge);
      
      return Right(DataState.fromServer(data));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  /// تحديث البيانات في الخلفية (بدون انتظار)
  void _updateInBackground<T>({
    required String cacheKey,
    required Future<T> Function() fetchFromRemote,
    required dynamic Function(T) toJson,
    required CacheConfig config,
  }) {
    // تنفيذ في الخلفية بدون await
    Future(() async {
      if (await networkInfo.isConnected) {
        try {
          final data = await fetchFromRemote();
          await _saveToCache(cacheKey, data, toJson, config.maxAge);
          print('✅ Background update completed for $cacheKey');
        } catch (e) {
          print('⚠️ Background update failed for $cacheKey: $e');
        }
      }
    });
  }

  /// قراءة البيانات من الكاش
  T? _readFromCache<T>(String key, T Function(dynamic) fromJson) {
    try {
      final cached = cacheService.read<String>(key);
      if (cached == null) return null;
      
      final decoded = jsonDecode(cached);
      return fromJson(decoded);
    } catch (e) {
      print('⚠️ Cache read error for $key: $e');
      return null;
    }
  }

  /// حفظ البيانات في الكاش
  Future<void> _saveToCache<T>(
    String key,
    T data,
    dynamic Function(T) toJson,
    Duration expiration,
  ) async {
    try {
      final json = toJson(data);
      final encoded = jsonEncode(json);
      await cacheService.save(key, encoded, expiration: expiration);
    } catch (e) {
      print('⚠️ Cache save error for $key: $e');
    }
  }

  /// مسح الكاش لمفتاح معين
  Future<void> clearCache(String key) async {
    await cacheService.remove(key);
  }

  /// مسح كل الكاش
  Future<void> clearAllCache() async {
    await cacheService.clearAll();
  }

  /// فحص ما إذا كانت البيانات موجودة في الكاش
  bool hasCachedData(String key) {
    return cacheService.has(key);
  }

  /// الحصول على وقت آخر تحديث للبيانات
  DateTime? getLastUpdateTime(String key) {
    return cacheService.getLastUpdateTime(key);
  }
}
