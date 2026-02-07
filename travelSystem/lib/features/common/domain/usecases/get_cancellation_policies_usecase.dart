import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/usecase.dart';

import '../entities/cancellation_policy_entity.dart';
import '../repositories/common_repository.dart';

/// Use case for getting cancellation policies
class GetCancellationPoliciesUseCase implements UseCase<List<CancellationPolicyEntity>, NoParams> {
  final CommonRepository repository;

  GetCancellationPoliciesUseCase(this.repository);

  @override
  Future<Either<Failure, List<CancellationPolicyEntity>>> call(NoParams params) async {
    return await repository.getCancellationPolicies();
  }
}
