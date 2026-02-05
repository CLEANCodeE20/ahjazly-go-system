

import '../../domain/entities/driver_entity.dart';

class DriverModel extends DriverEntity {
  DriverModel({
    required super.driverId,
    super.userId,
    required super.partnerId,
    required super.fullName,
    super.phoneNumber,
    super.licenseNumber,
    super.licenseExpiry,
    required super.status,
    super.employmentType,
    super.hireDate,
    super.terminationDate,
    super.emergencyContactName,
    super.emergencyContactPhone,
    super.bloodType,
    super.notes,
    required super.createdAt,
  });

  factory DriverModel.fromJson(Map<String, dynamic> json) {
    return DriverModel(
      driverId: json['driver_id'] as int,
      userId: json['user_id'] as int?,
      partnerId: json['partner_id'] as int,
      fullName: json['full_name'] as String,
      phoneNumber: json['phone_number'] as String?,
      licenseNumber: json['license_number'] as String?,
      licenseExpiry: json['license_expiry'] != null
          ? DateTime.parse(json['license_expiry'])
          : null,
      status: json['status'] as String,
      employmentType: json['employment_type'] as String?,
      hireDate: json['hire_date'] != null
          ? DateTime.parse(json['hire_date'])
          : null,
      terminationDate: json['termination_date'] != null
          ? DateTime.parse(json['termination_date'])
          : null,
      emergencyContactName: json['emergency_contact_name'] as String?,
      emergencyContactPhone: json['emergency_contact_phone'] as String?,
      bloodType: json['blood_type'] as String?,
      notes: json['notes'] as String?,
      createdAt: DateTime.parse(json['created_at']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'driver_id': driverId,
      'user_id': userId,
      'partner_id': partnerId,
      'full_name': fullName,
      'phone_number': phoneNumber,
      'license_number': licenseNumber,
      'license_expiry': licenseExpiry?.toIso8601String(),
      'status': status,
      'employment_type': employmentType,
      'hire_date': hireDate?.toIso8601String(),
      'termination_date': terminationDate?.toIso8601String(),
      'emergency_contact_name': emergencyContactName,
      'emergency_contact_phone': emergencyContactPhone,
      'blood_type': bloodType,
      'notes': notes,
      'created_at': createdAt.toIso8601String(),
    };
  }
}
