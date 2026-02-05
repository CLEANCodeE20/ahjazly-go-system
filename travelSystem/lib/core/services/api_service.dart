import 'package:dio/dio.dart';
import 'package:get/get.dart' hide Response;
import 'package:pretty_dio_logger/pretty_dio_logger.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../constants/api_endpoints.dart';
import '../constants/app_constants.dart';
import '../../features/auth/controller/AuthService.dart';

// ============ Custom Exceptions ============

/// استثناء مشاكل الشبكة
class NetworkException implements Exception {
  final String message;
  NetworkException(this.message);
  
  @override
  String toString() => message;
}

/// استثناء أخطاء الخادم
class ServerException implements Exception {
  final String message;
  final int? statusCode;
  
  ServerException(this.message, {this.statusCode});
  
  @override
  String toString() => message;
}

/// استثناء أخطاء المصادقة
class AuthException implements Exception {
  final String message;
  AuthException(this.message);
  
  @override
  String toString() => message;
}

// ============ API Service ============

class ApiService extends GetxService {
  late Dio _dio;
  SupabaseClient get supabase => Supabase.instance.client;
  
  @override
  void onInit() {
    super.onInit();
    _initializeDio();
  }

  void _initializeDio() {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiEndpoints.baseUrl,
        connectTimeout: AppConstants.connectionTimeout,
        receiveTimeout: AppConstants.receiveTimeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    // Logging في وضع التطوير فقط
    if (Get.isLogEnable) {
      _dio.interceptors.add(PrettyDioLogger(
        requestHeader: true,
        requestBody: true,
        responseBody: true,
        responseHeader: false,
        error: true,
        compact: true,
      ));
    }

    // Auth Interceptor
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        try {
          final authService = Get.find<AuthService>();
          final token = authService.userToken;
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
        } catch (e) {
          // AuthService غير متوفر بعد
        }
        return handler.next(options);
      },
      onError: (DioException e, handler) {
        // معالجة خطأ 401 (Unauthorized)
        if (e.response?.statusCode == 401) {
          try {
            Get.find<AuthService>().logout();
          } catch (e) {
            // AuthService غير متوفر
          }
        }
        return handler.next(e);
      },
    ));
  }

  // ============ HTTP Methods ============

  /// طلب GET
  Future<Response> get(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) async {
    try {
      return await _dio.get(path, queryParameters: queryParameters);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  /// طلب POST
  Future<Response> post(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
  }) async {
    try {
      return await _dio.post(
        path,
        data: data,
        queryParameters: queryParameters,
      );
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  /// طلب PUT
  Future<Response> put(String path, {dynamic data}) async {
    try {
      return await _dio.put(path, data: data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  /// طلب DELETE
  Future<Response> delete(String path, {dynamic data}) async {
    try {
      return await _dio.delete(path, data: data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  /// طلب PATCH
  Future<Response> patch(String path, {dynamic data}) async {
    try {
      return await _dio.patch(path, data: data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // ============ Error Handling ============

  /// معالجة الأخطاء - فقط throw exception بدون عرض UI
  Exception _handleError(DioException e) {
    // أخطاء الاتصال والوقت
    if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.sendTimeout) {
      return NetworkException('انتهى وقت الاتصال. حاول مرة أخرى.');
    }
    
    if (e.type == DioExceptionType.receiveTimeout) {
      return NetworkException('انتهى وقت استقبال البيانات. حاول مرة أخرى.');
    }
    
    if (e.type == DioExceptionType.connectionError) {
      return NetworkException('تحقق من اتصالك بالإنترنت وحاول مرة أخرى.');
    }
    
    // أخطاء الخادم مع response
    if (e.response != null) {
      final statusCode = e.response!.statusCode;
      String message = 'حدث خطأ في الخادم';
      
      // استخراج الرسالة من الاستجابة
      if (e.response?.data != null && e.response?.data is Map) {
        message = e.response?.data['message'] ?? 
                  e.response?.data['error'] ?? 
                  message;
      }
      
      // معالجة حالات محددة
      switch (statusCode) {
        case 400:
          return ServerException('طلب غير صالح: $message', statusCode: 400);
        case 401:
          return AuthException('يجب تسجيل الدخول أولاً');
        case 403:
          return AuthException('ليس لديك صلاحية للوصول');
        case 404:
          return ServerException('المورد المطلوب غير موجود', statusCode: 404);
        case 422:
          return ServerException('بيانات غير صالحة: $message', statusCode: 422);
        case 500:
        case 502:
        case 503:
          return ServerException('خطأ في الخادم. حاول مرة أخرى لاحقاً', 
              statusCode: statusCode);
        default:
          return ServerException(message, statusCode: statusCode);
      }
    }
    
    // خطأ في إلغاء الطلب
    if (e.type == DioExceptionType.cancel) {
      return Exception('تم إلغاء الطلب');
    }
    
    // خطأ غير معروف
    return Exception('حدث خطأ غير متوقع: ${e.message}');
  }
  
  // ============ Utility Methods ============
  
  /// إلغاء جميع الطلبات
  void cancelAllRequests() {
    _dio.close(force: true);
    _initializeDio();
  }
}
