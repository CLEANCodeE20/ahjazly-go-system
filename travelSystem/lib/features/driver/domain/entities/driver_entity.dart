class DriverEntity {
  final int driverId;
  final int? userId;
  final int partnerId;
  final String fullName;
  final String? phoneNumber;
  final String? licenseNumber;
  final DateTime? licenseExpiry;
  final String status;
  final String? employmentType;
  final DateTime? hireDate;
  final DateTime? terminationDate;
  final String? emergencyContactName;
  final String? emergencyContactPhone;
  final String? bloodType;
  final String? notes;
  final DateTime createdAt;

  DriverEntity({
    required this.driverId,
    this.userId,
    required this.partnerId,
    required this.fullName,
    this.phoneNumber,
    this.licenseNumber,
    this.licenseExpiry,
    required this.status,
    this.employmentType,
    this.hireDate,
    this.terminationDate,
    this.emergencyContactName,
    this.emergencyContactPhone,
    this.bloodType,
    this.notes,
    required this.createdAt,
  });
}
