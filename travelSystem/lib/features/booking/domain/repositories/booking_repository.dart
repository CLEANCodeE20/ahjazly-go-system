import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/booking_entity.dart';
import '../entities/cancel_preview_entity.dart';
import '../usecases/create_booking_params.dart';

abstract class BookingRepository {
  Future<Either<Failure, List<BookingEntity>>> getUserBookings(String authId);
  Future<Either<Failure, CancelPreviewEntity>> cancelBooking(int bookingId, {String? reason, bool confirm = false});
  Future<Either<Failure, BookingEntity>> createBooking(CreateBookingParams params);
  Future<Either<Failure, void>> updatePaymentStatus({
    required int bookingId,
    required String status,
    required String method,
    String? transactionId,
  });
  Future<Either<Failure, Map<String, dynamic>>> getAvailableSeats(int tripId);
  Future<Either<Failure, String?>> uploadIdImage(String fileName, List<int> bytes);
}
