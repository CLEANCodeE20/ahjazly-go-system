import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/usecase.dart';

import '../entities/faq_entity.dart';
import '../repositories/common_repository.dart';

/// Use case for getting FAQs
class GetFAQsUseCase implements UseCase<List<FAQEntity>, NoParams> {
  final CommonRepository repository;

  GetFAQsUseCase(this.repository);

  @override
  Future<Either<Failure, List<FAQEntity>>> call(NoParams params) async {
    return await repository.getFAQs();
  }
}
