import 'package:dartz/dartz.dart';

import '../../../../core/error/failures.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/driver_document_entity.dart';
import '../repositories/driver_repository.dart';

class UploadDriverDocumentUseCase implements UseCase<DriverDocumentEntity, UploadDriverDocumentParams> {
  final DriverRepository repository;

  UploadDriverDocumentUseCase(this.repository);

  @override
  Future<Either<Failure, DriverDocumentEntity>> call(UploadDriverDocumentParams params) async {
    return await repository.uploadDocument(
      driverId: params.driverId,
      filePath: params.filePath,
      fileName: params.fileName,
      documentType: params.documentType,
      expiryDate: params.expiryDate,
    );
  }
}

class UploadDriverDocumentParams {
  final int driverId;
  final String filePath;
  final String fileName;
  final String documentType;
  final String? expiryDate;

  UploadDriverDocumentParams({
    required this.driverId,
    required this.filePath,
    required this.fileName,
    required this.documentType,
    this.expiryDate,
  });
}
