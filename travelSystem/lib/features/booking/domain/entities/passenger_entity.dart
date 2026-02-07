class PassengerEntity {
  final String fullName;
  final String idNumber;
  final String? seatCode;
  final int? seatLayoutNumber;
  final int? seatId;
  final String? gender;
  final String? birthDate;
  final String? phoneNumber;
  final String? idPhoto;

  PassengerEntity({
    required this.fullName,
    required this.idNumber,
    this.seatCode,
    this.seatLayoutNumber,
    this.seatId,
    this.gender,
    this.birthDate,
    this.phoneNumber,
    this.idPhoto,
  });
}
