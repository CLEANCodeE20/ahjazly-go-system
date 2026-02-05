class ServerException implements Exception {
  final String? message;
  ServerException([this.message]);
}

class OfflineException implements Exception {}

class ValidationException implements Exception {
  final String message;
  ValidationException(this.message);
}
