import 'package:equatable/equatable.dart';

/// Entity representing user notification settings
class NotificationSettingsEntity extends Equatable {
  final String userId;
  final bool pushEnabled;
  final bool emailEnabled;
  final bool smsEnabled;
  final bool tripReminders;
  final bool promotions;
  final bool bookingUpdates;
  final bool paymentAlerts;
  final DateTime? updatedAt;

  const NotificationSettingsEntity({
    required this.userId,
    required this.pushEnabled,
    required this.emailEnabled,
    required this.smsEnabled,
    required this.tripReminders,
    required this.promotions,
    required this.bookingUpdates,
    required this.paymentAlerts,
    this.updatedAt,
  });

  @override
  List<Object?> get props => [
        userId,
        pushEnabled,
        emailEnabled,
        smsEnabled,
        tripReminders,
        promotions,
        bookingUpdates,
        paymentAlerts,
        updatedAt,
      ];

  NotificationSettingsEntity copyWith({
    String? userId,
    bool? pushEnabled,
    bool? emailEnabled,
    bool? smsEnabled,
    bool? tripReminders,
    bool? promotions,
    bool? bookingUpdates,
    bool? paymentAlerts,
    DateTime? updatedAt,
  }) {
    return NotificationSettingsEntity(
      userId: userId ?? this.userId,
      pushEnabled: pushEnabled ?? this.pushEnabled,
      emailEnabled: emailEnabled ?? this.emailEnabled,
      smsEnabled: smsEnabled ?? this.smsEnabled,
      tripReminders: tripReminders ?? this.tripReminders,
      promotions: promotions ?? this.promotions,
      bookingUpdates: bookingUpdates ?? this.bookingUpdates,
      paymentAlerts: paymentAlerts ?? this.paymentAlerts,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
