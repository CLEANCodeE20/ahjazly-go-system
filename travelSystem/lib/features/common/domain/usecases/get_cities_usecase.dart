import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/usecase.dart';

import '../entities/city_entity.dart';
import '../repositories/common_repository.dart';

/// Use case for getting cities
class GetCitiesUseCase implements UseCase<List<CityEntity>, NoParams> {
  final CommonRepository repository;

  GetCitiesUseCase(this.repository);

  @override
  Future<Either<Failure, List<CityEntity>>> call(NoParams params) async {
    return await repository.getCities();
  }
}
