import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/usecase.dart';
import '../repositories/auth_repository.dart';

class VerifyCodeUseCase implements UseCase<bool, VerifyCodeParams> {
  final AuthRepository repository;

  VerifyCodeUseCase(this.repository);

  @override
  Future<Either<Failure, bool>> call(VerifyCodeParams params) async {
    return await repository.verifyCode(params.email, params.code);
  }
}

class VerifyCodeParams {
  final String email;
  final String code;

  VerifyCodeParams({required this.email, required this.code});
}
