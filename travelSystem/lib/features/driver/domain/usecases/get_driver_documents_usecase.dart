import 'package:dartz/dartz.dart';

import '../../../../core/error/failures.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/driver_document_entity.dart';
import '../repositories/driver_repository.dart';

class GetDriverDocumentsUseCase implements UseCase<List<DriverDocumentEntity>, int> {
  final DriverRepository repository;

  GetDriverDocumentsUseCase(this.repository);

  @override
  Future<Either<Failure, List<DriverDocumentEntity>>> call(int driverId) async {
    return await repository.getDriverDocuments(driverId);
  }
}
