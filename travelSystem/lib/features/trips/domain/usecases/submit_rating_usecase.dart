import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/rating_entity.dart';
import '../repositories/trips_repository.dart';

class SubmitRatingUseCase {
  final TripsRepository repository;

  SubmitRatingUseCase(this.repository);

  Future<Either<Failure, RatingEntity>> call({
    required int tripId,
    required int bookingId,
    required int partnerId,
    int? driverId,
    required int stars,
    int? serviceRating,
    int? cleanlinessRating,
    int? punctualityRating,
    int? comfortRating,
    int? valueForMoneyRating,
    String? comment,
  }) async {
    return await repository.submitRating(
      tripId: tripId,
      bookingId: bookingId,
      partnerId: partnerId,
      driverId: driverId,
      stars: stars,
      serviceRating: serviceRating,
      cleanlinessRating: cleanlinessRating,
      punctualityRating: punctualityRating,
      comfortRating: comfortRating,
      valueForMoneyRating: valueForMoneyRating,
      comment: comment,
    );
  }
}
