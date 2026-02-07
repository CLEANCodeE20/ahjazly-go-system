import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/rating_entity.dart';
import '../repositories/trips_repository.dart';

class GetPartnerStatsUseCase {
  final TripsRepository repository;

  GetPartnerStatsUseCase(this.repository);

  Future<Either<Failure, PartnerRatingStatsEntity>> call(int partnerId) async {
    return await repository.getPartnerStats(partnerId);
  }
}
