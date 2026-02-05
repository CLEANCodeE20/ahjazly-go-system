import 'package:flutter/material.dart';
import 'package:get/get.dart';

enum ErrorType { 
  network, 
  server, 
  validation, 
  unknown 
}

class AppError {
  final ErrorType type;
  final String message;
  final String? details;
  final int? statusCode;
  
  AppError({
    required this.type,
    required this.message,
    this.details,
    this.statusCode,
  });
  
  factory AppError.network(String message) => AppError(
    type: ErrorType.network,
    message: message,
  );
  
  factory AppError.server(String message, {int? statusCode}) => AppError(
    type: ErrorType.server,
    message: message,
    statusCode: statusCode,
  );
  
  factory AppError.validation(String message) => AppError(
    type: ErrorType.validation,
    message: message,
  );
}

class ErrorHandler {
  /// عرض رسالة خطأ مع تنسيق موحد
  static void showError(
    String message, {
    ErrorType type = ErrorType.unknown,
    Duration duration = const Duration(seconds: 3),
    SnackPosition position = SnackPosition.BOTTOM,
  }) {
    final config = _getErrorConfig(type);
    
    Get.snackbar(
      config.title,
      message,
      snackPosition: position,
      backgroundColor: config.backgroundColor,
      colorText: config.textColor,
      icon: Icon(config.icon, color: config.iconColor),
      duration: duration,
      margin: const EdgeInsets.all(16),
      borderRadius: 12,
      isDismissible: true,
      dismissDirection: DismissDirection.horizontal,
    );
  }
  
  /// عرض رسالة نجاح
  static void showSuccess(
    String message, {
    Duration duration = const Duration(seconds: 2),
  }) {
    Get.snackbar(
      'نجح',
      message,
      snackPosition: SnackPosition.BOTTOM,
      backgroundColor: Colors.green[100],
      colorText: Colors.green[900],
      icon: const Icon(Icons.check_circle_outline, color: Colors.green),
      duration: duration,
      margin: const EdgeInsets.all(16),
      borderRadius: 12,
    );
  }
  
  /// عرض رسالة معلومات
  static void showInfo(
    String message, {
    Duration duration = const Duration(seconds: 2),
  }) {
    Get.snackbar(
      'معلومة',
      message,
      snackPosition: SnackPosition.BOTTOM,
      backgroundColor: Colors.blue[100],
      colorText: Colors.blue[900],
      icon: const Icon(Icons.info_outline, color: Colors.blue),
      duration: duration,
      margin: const EdgeInsets.all(16),
      borderRadius: 12,
    );
  }
  
  /// عرض رسالة تحذير
  static void showWarning(
    String message, {
    Duration duration = const Duration(seconds: 3),
  }) {
    Get.snackbar(
      'تحذير',
      message,
      snackPosition: SnackPosition.BOTTOM,
      backgroundColor: Colors.orange[100],
      colorText: Colors.orange[900],
      icon: const Icon(Icons.warning_amber_outlined, color: Colors.orange),
      duration: duration,
      margin: const EdgeInsets.all(16),
      borderRadius: 12,
    );
  }
  
  static _ErrorConfig _getErrorConfig(ErrorType type) {
    switch (type) {
      case ErrorType.network:
        return _ErrorConfig(
          title: 'خطأ في الاتصال',
          icon: Icons.wifi_off,
          backgroundColor: Colors.red[100]!,
          textColor: Colors.red[900]!,
          iconColor: Colors.red,
        );
      case ErrorType.server:
        return _ErrorConfig(
          title: 'خطأ في الخادم',
          icon: Icons.cloud_off,
          backgroundColor: Colors.red[100]!,
          textColor: Colors.red[900]!,
          iconColor: Colors.red,
        );
      case ErrorType.validation:
        return _ErrorConfig(
          title: 'خطأ في البيانات',
          icon: Icons.error_outline,
          backgroundColor: Colors.orange[100]!,
          textColor: Colors.orange[900]!,
          iconColor: Colors.orange,
        );
      case ErrorType.unknown:
      default:
        return _ErrorConfig(
          title: 'خطأ',
          icon: Icons.error_outline,
          backgroundColor: Colors.red[100]!,
          textColor: Colors.red[900]!,
          iconColor: Colors.red,
        );
    }
  }
}

class _ErrorConfig {
  final String title;
  final IconData icon;
  final Color backgroundColor;
  final Color textColor;
  final Color iconColor;
  
  _ErrorConfig({
    required this.title,
    required this.icon,
    required this.backgroundColor,
    required this.textColor,
    required this.iconColor,
  });
}
