class DriverSettingsEntity {
  final int driverId;
  final bool isAvailable;
  final String? preferredLanguage;
  final bool notificationsEnabled;

  DriverSettingsEntity({
    required this.driverId,
    required this.isAvailable,
    this.preferredLanguage,
    required this.notificationsEnabled,
  });
}
