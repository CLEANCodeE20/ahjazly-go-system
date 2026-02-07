import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/banner_entity.dart';
import '../repositories/home_repository.dart';

class GetBannersUseCase implements UseCase<List<BannerEntity>, NoParams> {
  final HomeRepository repository;

  GetBannersUseCase(this.repository);

  @override
  Future<Either<Failure, List<BannerEntity>>> call(NoParams params) async {
    return await repository.getBanners();
  }
}
