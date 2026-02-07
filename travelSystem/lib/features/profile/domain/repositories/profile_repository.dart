import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/user_profile_entity.dart';
import '../entities/notification_settings_entity.dart';

/// Repository interface for profile-related operations
abstract class ProfileRepository {
  /// Get user profile by user ID
  Future<Either<Failure, UserProfileEntity>> getUserProfile(String userId);

  /// Update user profile
  Future<Either<Failure, UserProfileEntity>> updateProfile(
    UserProfileEntity profile,
  );

  /// Get notification settings for a user
  Future<Either<Failure, NotificationSettingsEntity>> getNotificationSettings(
    String userId,
  );

  /// Update notification settings
  Future<Either<Failure, NotificationSettingsEntity>> updateNotificationSettings(
    NotificationSettingsEntity settings,
  );

  /// Upload profile image
  Future<Either<Failure, String>> uploadProfileImage(
    String userId,
    String filePath,
  );
}
