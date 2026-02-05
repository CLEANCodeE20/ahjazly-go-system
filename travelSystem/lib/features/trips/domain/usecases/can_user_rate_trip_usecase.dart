import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../repositories/trips_repository.dart';

class CanUserRateTripUseCase {
  final TripsRepository repository;

  CanUserRateTripUseCase(this.repository);

  Future<Either<Failure, bool>> call({
    required int userId,
    required int tripId,
    required int bookingId,
  }) async {
    return await repository.canUserRateTrip(
      userId: userId,
      tripId: tripId,
      bookingId: bookingId,
    );
  }
}
