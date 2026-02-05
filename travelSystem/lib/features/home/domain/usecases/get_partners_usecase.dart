import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/partner_entity.dart';
import '../repositories/home_repository.dart';

class GetPartnersUseCase implements UseCase<List<PartnerEntity>, NoParams> {
  final HomeRepository repository;

  GetPartnersUseCase(this.repository);

  @override
  Future<Either<Failure, List<PartnerEntity>>> call(NoParams params) async {
    return await repository.getPartners();
  }
}
