import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/usecase.dart';

import '../entities/user_profile_entity.dart';
import '../repositories/profile_repository.dart';

/// Use case for updating user profile
class UpdateProfileUseCase implements UseCase<UserProfileEntity, UserProfileEntity> {
  final ProfileRepository repository;

  UpdateProfileUseCase(this.repository);

  @override
  Future<Either<Failure, UserProfileEntity>> call(UserProfileEntity profile) async {
    return await repository.updateProfile(profile);
  }
}
