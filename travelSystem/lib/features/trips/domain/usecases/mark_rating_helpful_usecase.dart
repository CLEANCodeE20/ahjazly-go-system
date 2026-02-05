import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../repositories/trips_repository.dart';

class MarkRatingHelpfulUseCase {
  final TripsRepository repository;

  MarkRatingHelpfulUseCase(this.repository);

  Future<Either<Failure, Map<String, dynamic>>> call({
    required int ratingId,
    required bool isHelpful,
  }) async {
    return await repository.markRatingHelpful(
      ratingId: ratingId,
      isHelpful: isHelpful,
    );
  }
}
