import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/usecase.dart';
import '../repositories/driver_repository.dart';

class UpdateDriverSettingsUseCase implements UseCase<void, UpdateDriverSettingsParams> {
  final DriverRepository repository;

  UpdateDriverSettingsUseCase(this.repository);

  @override
  Future<Either<Failure, void>> call(UpdateDriverSettingsParams params) async {
    return await repository.updateDriverSettings(params.driverId, params.settings);
  }
}

class UpdateDriverSettingsParams {
  final int driverId;
  final Map<String, dynamic> settings;

  UpdateDriverSettingsParams({
    required this.driverId,
    required this.settings,
  });
}
