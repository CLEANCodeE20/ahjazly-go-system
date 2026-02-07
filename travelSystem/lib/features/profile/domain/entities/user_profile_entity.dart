

import 'package:equatable/equatable.dart';

/// Entity representing user profile information
class UserProfileEntity extends Equatable {
  final String userId;
  final String fullName;
  final String email;
  final String? phone;
  final String? profileImage;
  final DateTime createdAt;
  final DateTime? updatedAt;

  const UserProfileEntity({
    required this.userId,
    required this.fullName,
    required this.email,
    this.phone,
    this.profileImage,
    required this.createdAt,
    this.updatedAt,
  });

  @override
  List<Object?> get props => [
        userId,
        fullName,
        email,
        phone,
        profileImage,
        createdAt,
        updatedAt,
      ];

  UserProfileEntity copyWith({
    String? userId,
    String? fullName,
    String? email,
    String? phone,
    String? profileImage,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return UserProfileEntity(
      userId: userId ?? this.userId,
      fullName: fullName ?? this.fullName,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      profileImage: profileImage ?? this.profileImage,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
