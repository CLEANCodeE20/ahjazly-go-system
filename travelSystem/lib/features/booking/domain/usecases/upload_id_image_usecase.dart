import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../repositories/booking_repository.dart';

class UploadIdImageUseCase {
  final BookingRepository repository;

  UploadIdImageUseCase(this.repository);

  Future<Either<Failure, String?>> call(String fileName, List<int> bytes) async {
    return await repository.uploadIdImage(fileName, bytes);
  }
}
