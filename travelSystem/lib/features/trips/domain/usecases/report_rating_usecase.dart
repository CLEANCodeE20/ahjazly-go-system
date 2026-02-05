import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../repositories/trips_repository.dart';

class ReportRatingUseCase {
  final TripsRepository repository;

  ReportRatingUseCase(this.repository);

  Future<Either<Failure, bool>> call({
    required int ratingId,
    required String reason,
    String? description,
  }) async {
    return await repository.reportRating(
      ratingId: ratingId,
      reason: reason,
      description: description,
    );
  }
}
