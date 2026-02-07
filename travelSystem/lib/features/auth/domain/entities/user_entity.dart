class UserEntity {
  final String id;
  final String authId;
  final String email;
  final String fullName;
  final String phoneNumber;
  final String userType;

  const UserEntity({
    required this.id,
    required this.authId,
    required this.email,
    required this.fullName,
    required this.phoneNumber,
    required this.userType,
  });
}
