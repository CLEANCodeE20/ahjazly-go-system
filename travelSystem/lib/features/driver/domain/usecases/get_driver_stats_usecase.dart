import 'package:dartz/dartz.dart';

import '../../../../core/error/failures.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/driver_stats_entity.dart';
import '../repositories/driver_repository.dart';

class GetDriverStatsUseCase implements UseCase<DriverStatsEntity, int> {
  final DriverRepository repository;

  GetDriverStatsUseCase(this.repository);

  @override
  Future<Either<Failure, DriverStatsEntity>> call(int driverId) async {
    return await repository.getDriverStats(driverId);
  }
}
