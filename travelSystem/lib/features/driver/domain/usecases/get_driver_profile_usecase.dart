import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/driver_entity.dart';
import '../repositories/driver_repository.dart';

class GetDriverProfileUseCase implements UseCase<DriverEntity, String> {
  final DriverRepository repository;

  GetDriverProfileUseCase(this.repository);

  @override
  Future<Either<Failure, DriverEntity>> call(String authId) async {
    return await repository.getDriverByAuthId(authId);
  }
}
