import 'package:dartz/dartz.dart';

import '../../../../core/error/failures.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/driver_settings_entity.dart';
import '../repositories/driver_repository.dart';

class GetDriverSettingsUseCase implements UseCase<DriverSettingsEntity, int> {
  final DriverRepository repository;

  GetDriverSettingsUseCase(this.repository);

  @override
  Future<Either<Failure, DriverSettingsEntity>> call(int driverId) async {
    return await repository.getDriverSettings(driverId);
  }
}
