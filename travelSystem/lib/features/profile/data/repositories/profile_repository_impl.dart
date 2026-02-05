import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/network_info.dart';
import '../../domain/entities/user_profile_entity.dart';
import '../../domain/entities/notification_settings_entity.dart';
import '../../domain/repositories/profile_repository.dart';
import '../datasources/profile_remote_data_source.dart';
import '../models/user_profile_model.dart';
import '../models/notification_settings_model.dart';

/// Implementation of ProfileRepository
class ProfileRepositoryImpl implements ProfileRepository {
  final ProfileRemoteDataSource remoteDataSource;
  final NetworkInfo networkInfo;

  ProfileRepositoryImpl({
    required this.remoteDataSource,
    required this.networkInfo,
  });

  @override
  Future<Either<Failure, UserProfileEntity>> getUserProfile(
    String userId,
  ) async {
    if (!await networkInfo.isConnected) {
      return Left(OfflineFailure('No Internet Connection'));
    }

    try {
      final profile = await remoteDataSource.getUserProfile(userId);
      return Right(profile.toEntity());
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, UserProfileEntity>> updateProfile(
    UserProfileEntity profile,
  ) async {
    if (!await networkInfo.isConnected) {
      return Left(OfflineFailure('No Internet Connection'));
    }

    try {
      final profileModel = UserProfileModel.fromEntity(profile);
      final updatedProfile = await remoteDataSource.updateProfile(profileModel);
      return Right(updatedProfile.toEntity());
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, NotificationSettingsEntity>> getNotificationSettings(
    String userId,
  ) async {
    if (!await networkInfo.isConnected) {
      return Left(OfflineFailure('No Internet Connection'));
    }

    try {
      final settings = await remoteDataSource.getNotificationSettings(userId);
      return Right(settings.toEntity());
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, NotificationSettingsEntity>> updateNotificationSettings(
    NotificationSettingsEntity settings,
  ) async {
    if (!await networkInfo.isConnected) {
      return Left(OfflineFailure('No Internet Connection'));
    }

    try {
      final settingsModel = NotificationSettingsModel.fromEntity(settings);
      final updatedSettings = await remoteDataSource.updateNotificationSettings(settingsModel);
      return Right(updatedSettings.toEntity());
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, String>> uploadProfileImage(
    String userId,
    String filePath,
  ) async {
    if (!await networkInfo.isConnected) {
      return Left(OfflineFailure('No Internet Connection'));
    }

    try {
      final imageUrl = await remoteDataSource.uploadProfileImage(userId, filePath);
      return Right(imageUrl);
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }
}
