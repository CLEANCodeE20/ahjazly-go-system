import 'package:flutter/foundation.dart';

/// Centralized logging utility for the application
/// 
/// Usage:
/// ```dart
/// AppLogger.info('User logged in');
/// AppLogger.error('Failed to load data', error: e, stackTrace: st);
/// AppLogger.warning('Deprecated feature used');
/// ```
class AppLogger {
  /// Log general information messages
  /// Only logs in debug mode
  static void log(String message, {String? tag}) {
    if (kDebugMode) {
      final prefix = tag != null ? '[$tag]' : '';
      debugPrint('$prefix $message');
    }
  }

  /// Log informational messages
  static void info(String message, {String? tag}) {
    if (kDebugMode) {
      final prefix = tag != null ? '[$tag]' : '[INFO]';
      debugPrint('ℹ️ $prefix $message');
    }
  }

  /// Log warning messages
  static void warning(String message, {String? tag}) {
    if (kDebugMode) {
      final prefix = tag != null ? '[$tag]' : '[WARNING]';
      debugPrint('⚠️ $prefix $message');
    }
  }

  /// Log error messages with optional error object and stack trace
  static void error(
    String message, {
    Object? error,
    StackTrace? stackTrace,
    String? tag,
  }) {
    if (kDebugMode) {
      final prefix = tag != null ? '[$tag]' : '[ERROR]';
      debugPrint('❌ $prefix $message');
      if (error != null) {
        debugPrint('   Error: $error');
      }
      if (stackTrace != null) {
        debugPrint('   StackTrace: $stackTrace');
      }
    }
  }

  /// Log debug messages (only in debug mode)
  static void debug(String message, {String? tag}) {
    if (kDebugMode) {
      final prefix = tag != null ? '[$tag]' : '[DEBUG]';
      debugPrint('🐛 $prefix $message');
    }
  }

  /// Log success messages
  static void success(String message, {String? tag}) {
    if (kDebugMode) {
      final prefix = tag != null ? '[$tag]' : '[SUCCESS]';
      debugPrint('✅ $prefix $message');
    }
  }
}
