import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/user_entity.dart';

abstract class AuthRepository {
  Future<Either<Failure, UserEntity>> login(String email, String password);
  Future<Either<Failure, UserEntity>> signUp(String email, String password, Map<String, dynamic> data);
  Future<Either<Failure, void>> logout();
  Future<Either<Failure, UserEntity?>> getCurrentUser();
  Future<Either<Failure, void>> resetPassword(String email, String code, String newPassword);
  Future<Either<Failure, String>> checkEmail(String email);
  Future<Either<Failure, bool>> verifyCode(String email, String code);
}
