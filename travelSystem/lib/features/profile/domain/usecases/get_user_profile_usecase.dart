import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/usecase.dart';

import '../entities/user_profile_entity.dart';
import '../repositories/profile_repository.dart';

/// Use case for getting user profile
class GetUserProfileUseCase implements UseCase<UserProfileEntity, String> {
  final ProfileRepository repository;

  GetUserProfileUseCase(this.repository);

  @override
  Future<Either<Failure, UserProfileEntity>> call(String userId) async {
    return await repository.getUserProfile(userId);
  }
}
