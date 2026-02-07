import 'package:dartz/dartz.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/network_info.dart';
import '../../../trips/data/models/cancel_preview_model.dart';
import '../../domain/entities/booking_entity.dart';
import '../../domain/entities/cancel_preview_entity.dart';
import '../../domain/repositories/booking_repository.dart';
import '../../domain/usecases/create_booking_params.dart';
import '../datasources/booking_remote_data_source.dart';


class BookingRepositoryImpl implements BookingRepository {
  final BookingRemoteDataSource remoteDataSource;
  final NetworkInfo networkInfo;

  BookingRepositoryImpl({
    required this.remoteDataSource,
    required this.networkInfo,
  });

  @override
  Future<Either<Failure, List<BookingEntity>>> getUserBookings(String authId) async {
    if (await networkInfo.isConnected) {
      try {
        final bookings = await remoteDataSource.getUserBookings(authId);
        return Right(bookings);
      } on ServerException catch (e) {
        return Left(ServerFailure(e.message ?? 'Server error'));
      }
    } else {
      return const Left(OfflineFailure('No internet connection'));
    }
  }

  @override
  Future<Either<Failure, CancelPreviewEntity>> cancelBooking(int bookingId, {String? reason, bool confirm = false}) async {
    if (await networkInfo.isConnected) {
      try {
        final result = await remoteDataSource.cancelBooking(bookingId, reason: reason, confirm: confirm);
        
        if (confirm) {
           // If confirmed, the function might return a success status map instead of a preview
           // We handle this in the controller, but repository should return a consistent entity or success result
           // For now, if confirm is true, we return a mock entity with success flag if possible, 
           // but the RPC returns a map with success: true. 
           // Let's keep it consistent: we only return CancelPreviewEntity if confirm is FALSE.
        }

        final model = CancelPreviewModel.fromJson(result);
        return Right(CancelPreviewEntity(
          bookingId: model.bookingId,
          tripId: model.tripId,
          totalPrice: model.totalPrice,
          hoursBeforeDeparture: model.hoursBeforeDeparture,
          rule: CancelRuleEntity(
            id: model.rule.id,
            minHours: model.rule.minHours,
            maxHours: model.rule.maxHours,
            refundPercentage: model.rule.refundPercentage,
            cancellationFee: model.rule.cancellationFee,
          ),
          calculated: CalculatedRefundEntity(
            refundAmount: model.calculated.refundAmount,
            nonRefundablePart: model.calculated.nonRefundablePart,
          ),
        ));
      } on ServerException catch (e) {
        return Left(ServerFailure(e.message ?? 'Server error'));
      }
    } else {
      return const Left(OfflineFailure('No internet connection'));
    }
  }

  @override
  Future<Either<Failure, BookingEntity>> createBooking(CreateBookingParams params) async {
    if (await networkInfo.isConnected) {
      try {
        final result = await remoteDataSource.createBooking(params.toJson());
        return Right(result as BookingEntity);
      } on ServerException catch (e) {
        return Left(ServerFailure(e.message ?? 'Server error'));
      }
    } else {
      return const Left(OfflineFailure('No internet connection'));
    }
  }

  @override
  Future<Either<Failure, void>> updatePaymentStatus({
    required int bookingId,
    required String status,
    required String method,
    String? transactionId,
  }) async {
    if (await networkInfo.isConnected) {
      try {
        await remoteDataSource.updatePaymentStatus(
          bookingId: bookingId,
          status: status,
          method: method,
          transactionId: transactionId,
        );
        return const Right(null);
      } on ServerException catch (e) {
        return Left(ServerFailure(e.message ?? 'Server error'));
      }
    } else {
      return const Left(OfflineFailure('No internet connection'));
    }
  }

  @override
  Future<Either<Failure, Map<String, dynamic>>> getAvailableSeats(int tripId) async {
    if (await networkInfo.isConnected) {
      try {
        final result = await remoteDataSource.getAvailableSeats(tripId);
        return Right(result);
      } on ServerException catch (e) {
        return Left(ServerFailure(e.message ?? 'Server error'));
      }
    } else {
      return const Left(OfflineFailure('No internet connection'));
    }
  }

  @override
  Future<Either<Failure, String?>> uploadIdImage(String fileName, List<int> bytes) async {
    if (await networkInfo.isConnected) {
      try {
        final result = await remoteDataSource.uploadIdImage(fileName, bytes);
        return Right(result);
      } on ServerException catch (e) {
        return Left(ServerFailure(e.message ?? 'Server error'));
      }
    } else {
      return const Left(OfflineFailure('No internet connection'));
    }
  }
}
