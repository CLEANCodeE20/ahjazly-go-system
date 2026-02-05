

import '../../domain/entities/driver_settings_entity.dart';

class DriverSettingsModel extends DriverSettingsEntity {
  DriverSettingsModel({
    required super.driverId,
    required super.isAvailable,
    super.preferredLanguage,
    required super.notificationsEnabled,
  });

  factory DriverSettingsModel.fromJson(Map<String, dynamic> json) {
    return DriverSettingsModel(
      driverId: json['driver_id'] as int,
      isAvailable: json['is_available'] as bool? ?? true,
      preferredLanguage: json['preferred_language'] as String?,
      notificationsEnabled: json['notifications_enabled'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'driver_id': driverId,
      'is_available': isAvailable,
      'preferred_language': preferredLanguage,
      'notifications_enabled': notificationsEnabled,
    };
  }
}
