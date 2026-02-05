import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/notification_settings_entity.dart';
import '../repositories/profile_repository.dart';

/// Use case for getting notification settings
class GetNotificationSettingsUseCase implements UseCase<NotificationSettingsEntity, String> {
  final ProfileRepository repository;

  GetNotificationSettingsUseCase(this.repository);

  @override
  Future<Either<Failure, NotificationSettingsEntity>> call(String userId) async {
    return await repository.getNotificationSettings(userId);
  }
}
