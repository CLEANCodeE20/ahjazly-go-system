import 'package:dio/dio.dart';
import 'package:get/get.dart' hide Response;
import '../error/exceptions.dart';
import '../error/failures.dart';


class ApiErrorHandler {
  static Failure handleError(dynamic error) {
    if (error is DioException) {
      switch (error.type) {
        case DioExceptionType.connectionTimeout:
        case DioExceptionType.sendTimeout:
        case DioExceptionType.receiveTimeout:
          return const ServerFailure("Connection timeout with server");
        case DioExceptionType.badResponse:
          return _handleBadResponse(error.response);
        case DioExceptionType.cancel:
          return const ServerFailure("Request to server was cancelled");
        case DioExceptionType.connectionError:
          return const OfflineFailure("No internet connection");
        default:
          return const ServerFailure("Unexpected error occurred");
      }
    } else if (error is OfflineException) {
      return const OfflineFailure("No internet connection");
    } else if (error is ServerException) {
      return ServerFailure(error.message ?? "Server Error");
    } else {
      return ServerFailure(error.toString());
    }
  }

  static Failure _handleBadResponse(Response? response) {
    try {
      if (response != null && response.data != null) {
        // Adjust this based on your API error response structure
        final message = response.data['message'] ?? response.data['error'] ?? "Unknown Server Error";
        return ServerFailure(message.toString());
      }
    } catch (e) {
      return const ServerFailure("Failed to parse server error");
    }
    return const ServerFailure("Unknown Server Error");
  }

  static void showErrorMessage(Failure failure) {
    Get.snackbar(
      "Error",
      failure.message,
      snackPosition: SnackPosition.BOTTOM,
      backgroundColor: Get.theme.colorScheme.error,
      colorText: Get.theme.colorScheme.onError,
      duration: const Duration(seconds: 3),
    );
  }
}
