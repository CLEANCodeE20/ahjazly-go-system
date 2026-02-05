import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/rating_entity.dart';
import '../repositories/trips_repository.dart';

class GetTripRatingsUseCase {
  final TripsRepository repository;

  GetTripRatingsUseCase(this.repository);

  Future<Either<Failure, List<TripRatingEntity>>> call({
    required int tripId,
    int limit = 10,
    int offset = 0,
  }) async {
    return await repository.getTripRatings(
      tripId: tripId,
      limit: limit,
      offset: offset,
    );
  }
}
