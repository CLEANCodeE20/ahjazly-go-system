import 'package:dartz/dartz.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/network_info.dart';
import '../../domain/entities/user_entity.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_remote_data_source.dart';
import '../models/user_model.dart';


class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource remoteDataSource;
  final NetworkInfo networkInfo;

  AuthRepositoryImpl({
    required this.remoteDataSource,
    required this.networkInfo,
  });

  @override
  Future<Either<Failure, UserEntity>> login(String email, String password) async {
    if (await networkInfo.isConnected) {
      try {
         final user = await remoteDataSource.login(email, password);
        return Right<Failure, UserEntity>(user);
      } on ServerException catch (e) {
        return Left(ServerFailure(e.message ?? 'Server error'));
      }
    } else {
      return const Left(OfflineFailure('No internet connection'));
    }
  }

  @override
  Future<Either<Failure, UserEntity>> signUp(String email, String password, Map<String, dynamic> data) async {
    if (await networkInfo.isConnected) {
      try {
        final user = await remoteDataSource.signUp(email, password, data);
        return Right<Failure, UserEntity>(user);
      } on ServerException catch (e) {
        return Left(ServerFailure(e.message ?? 'Server error'));
      }
    } else {
      return const Left(OfflineFailure('No internet connection'));
    }
  }

  @override
  Future<Either<Failure, void>> logout() async {
    try {
      await remoteDataSource.logout();
      return const Right(null);
    } catch (e) {
      return const Left(ServerFailure('Logout failed'));
    }
  }

  @override
  Future<Either<Failure, UserEntity?>> getCurrentUser() async {
    try {
      final user = await remoteDataSource.getCurrentUser();
      return Right<Failure, UserEntity?>(user);
    } catch (e) {
      return const Left(ServerFailure('Failed to get current user'));
    }
  }

  @override
  Future<Either<Failure, void>> resetPassword(String email, String code, String newPassword) async {
    if (await networkInfo.isConnected) {
      try {
        await remoteDataSource.resetPassword(email, code, newPassword);
        return const Right(null);
      } on ServerException catch (e) {
        return Left(ServerFailure(e.message ?? 'Server error'));
      }
    } else {
      return const Left(OfflineFailure('No internet connection'));
    }
  }

  @override
  Future<Either<Failure, String>> checkEmail(String email) async {
    if (await networkInfo.isConnected) {
      try {
        final authId = await remoteDataSource.checkEmail(email);
        return Right(authId);
      } on ServerException catch (e) {
        return Left(ServerFailure(e.message ?? 'Server error'));
      }
    } else {
      return const Left(OfflineFailure('No internet connection'));
    }
  }

  @override
  Future<Either<Failure, bool>> verifyCode(String email, String code) async {
    if (await networkInfo.isConnected) {
      try {
        final isCorrect = await remoteDataSource.verifyCode(email, code);
        return Right(isCorrect);
      } on ServerException catch (e) {
        return Left(ServerFailure(e.message ?? 'Server error'));
      }
    } else {
      return const Left(OfflineFailure('No internet connection'));
    }
  }
}
