import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/rating_entity.dart';
import '../repositories/trips_repository.dart';

class UpdateRatingUseCase {
  final TripsRepository repository;

  UpdateRatingUseCase(this.repository);

  Future<Either<Failure, RatingEntity>> call({
    required int ratingId,
    int? stars,
    int? serviceRating,
    int? cleanlinessRating,
    int? punctualityRating,
    int? comfortRating,
    int? valueForMoneyRating,
    String? comment,
  }) async {
    return await repository.updateRating(
      ratingId: ratingId,
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
