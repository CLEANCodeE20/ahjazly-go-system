class PassengerModel {
  String fullName;
  String idNumber;
  String? seatCode;
  int? seatLayoutNumber;
  int? seatId;       // معرف المقعد من Supabase

  String? gender;      // 'Male' / 'Female' مثلاً
  String? birthDate;   // نص بصيغة YYYY-MM-DD
  String? phoneNumber;
  String? idPhoto; // رابط الصورة أو base64

  PassengerModel({
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

  Map<String, dynamic> toJson() {
    return {
      'full_name': fullName,
      'id_number': idNumber,
      'seat_id': seatId,
      'gender': gender?.toLowerCase() == 'male' ? 'male' : 'female',
      'birth_date': birthDate,
      'phone_number': phoneNumber,
      'id_image': idPhoto,
    };
  }
}
