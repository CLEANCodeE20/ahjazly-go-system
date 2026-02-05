import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/usecase.dart';
import '../repositories/auth_repository.dart';

class CheckEmailUseCase implements UseCase<String, String> {
  final AuthRepository repository;

  CheckEmailUseCase(this.repository);

  @override
  Future<Either<Failure, String>> call(String email) async {
    return await repository.checkEmail(email);
  }
}
