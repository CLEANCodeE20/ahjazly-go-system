import '../../domain/entities/user_profile_entity.dart';

/// Model class for user profile data
class UserProfileModel extends UserProfileEntity {
  const UserProfileModel({
    required super.userId,
    required super.fullName,
    required super.email,
    super.phone,
    super.profileImage,
    required super.createdAt,
    super.updatedAt,
  });

  /// Create model from JSON
  factory UserProfileModel.fromJson(Map<String, dynamic> json) {
    return UserProfileModel(
      userId: json['auth_id']?.toString() ?? json['user_id']?.toString() ?? '',
      fullName: json['full_name'] as String? ?? 'Unknown',
      email: json['email'] as String? ?? '',
      phone: (json['phone_number'] ?? json['phone']) as String?,
      profileImage: json['profile_image'] as String?,
      createdAt: json['created_at'] != null 
          ? DateTime.parse(json['created_at'] as String) 
          : DateTime.now(),
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'] as String)
          : null,
    );
  }

  /// Convert model to JSON
  Map<String, dynamic> toJson() {
    return {
      'auth_id': userId, // Changed to auth_id
      'full_name': fullName,
      'email': email,
      'phone_number': phone,
      'profile_image': profileImage,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }

  /// Convert entity to model
  factory UserProfileModel.fromEntity(UserProfileEntity entity) {
    return UserProfileModel(
      userId: entity.userId,
      fullName: entity.fullName,
      email: entity.email,
      phone: entity.phone,
      profileImage: entity.profileImage,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    );
  }

  /// Convert model to entity
  UserProfileEntity toEntity() {
    return UserProfileEntity(
      userId: userId,
      fullName: fullName,
      email: email,
      phone: phone,
      profileImage: profileImage,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
}
