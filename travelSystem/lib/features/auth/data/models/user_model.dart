import '../../domain/entities/user_entity.dart';


class UserModel extends UserEntity {
  const UserModel({
    required super.id,
    required super.authId,
    required super.email,
    required super.fullName,
    required super.phoneNumber,
    required super.userType,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['auth_id']?.toString() ?? json['user_id']?.toString() ?? '',
      authId: json['auth_id'] as String,
      email: json['email'] as String,
      fullName: json['full_name'] as String,
      phoneNumber: json['phone_number'] as String? ?? '',
      userType: json['user_type'] as String? ?? 'customer',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'user_id': id, // Deprecated but kept for now as String
      'auth_id': id, // The new standard
      'email': email,
      'full_name': fullName,
      'phone_number': phoneNumber,
      'user_type': userType,
    };
  }
}
