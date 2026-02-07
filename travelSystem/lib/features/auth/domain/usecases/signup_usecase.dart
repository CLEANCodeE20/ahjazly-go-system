import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/user_entity.dart';
import '../repositories/auth_repository.dart';

class SignUpUseCase implements UseCase<UserEntity, SignUpParams> {
  final AuthRepository repository;

  SignUpUseCase(this.repository);

  @override
  Future<Either<Failure, UserEntity>> call(SignUpParams params) async {
    return await repository.signUp(params.email, params.password, params.data);
  }
}

class SignUpParams {
  final String email;
  final String password;
  final Map<String, dynamic> data;

  SignUpParams({
    required this.email,
    required this.password,
    required this.data,
  });
}
