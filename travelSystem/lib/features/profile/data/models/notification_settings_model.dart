import '../../domain/entities/notification_settings_entity.dart';

/// Model class for notification settings data
class NotificationSettingsModel extends NotificationSettingsEntity {
  const NotificationSettingsModel({
    required super.userId,
    required super.pushEnabled,
    required super.emailEnabled,
    required super.smsEnabled,
    required super.tripReminders,
    required super.promotions,
    required super.bookingUpdates,
    required super.paymentAlerts,
    super.updatedAt,
  });

  /// Create model from JSON
  factory NotificationSettingsModel.fromJson(Map<String, dynamic> json) {
    return NotificationSettingsModel(
      userId: json['user_id'] as String,
      pushEnabled: json['push_enabled'] as bool? ?? true,
      emailEnabled: json['email_enabled'] as bool? ?? true,
      smsEnabled: json['sms_enabled'] as bool? ?? false,
      tripReminders: json['trip_reminders'] as bool? ?? true,
      promotions: json['promotions'] as bool? ?? true,
      bookingUpdates: json['booking_updates'] as bool? ?? true,
      paymentAlerts: json['payment_alerts'] as bool? ?? true,
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'] as String)
          : null,
    );
  }

  /// Convert model to JSON
  Map<String, dynamic> toJson() {
    return {
      'user_id': userId,
      'push_enabled': pushEnabled,
      'email_enabled': emailEnabled,
      'sms_enabled': smsEnabled,
      'trip_reminders': tripReminders,
      'promotions': promotions,
      'booking_updates': bookingUpdates,
      'payment_alerts': paymentAlerts,
      'updated_at': updatedAt?.toIso8601String(),
    };
  }

  /// Convert entity to model
  factory NotificationSettingsModel.fromEntity(NotificationSettingsEntity entity) {
    return NotificationSettingsModel(
      userId: entity.userId,
      pushEnabled: entity.pushEnabled,
      emailEnabled: entity.emailEnabled,
      smsEnabled: entity.smsEnabled,
      tripReminders: entity.tripReminders,
      promotions: entity.promotions,
      bookingUpdates: entity.bookingUpdates,
      paymentAlerts: entity.paymentAlerts,
      updatedAt: entity.updatedAt,
    );
  }

  /// Convert model to entity
  NotificationSettingsEntity toEntity() {
    return NotificationSettingsEntity(
      userId: userId,
      pushEnabled: pushEnabled,
      emailEnabled: emailEnabled,
      smsEnabled: smsEnabled,
      tripReminders: tripReminders,
      promotions: promotions,
      bookingUpdates: bookingUpdates,
      paymentAlerts: paymentAlerts,
      updatedAt: updatedAt,
    );
  }
}
