import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/usecase.dart';

import '../entities/notification_settings_entity.dart';
import '../repositories/profile_repository.dart';

/// Use case for updating notification settings
class UpdateNotificationSettingsUseCase implements UseCase<NotificationSettingsEntity, NotificationSettingsEntity> {
  final ProfileRepository repository;

  UpdateNotificationSettingsUseCase(this.repository);

  @override
  Future<Either<Failure, NotificationSettingsEntity>> call(NotificationSettingsEntity settings) async {
    return await repository.updateNotificationSettings(settings);
  }
}
