import '../entities/passenger_entity.dart';

class CreateBookingParams {
  final String userId;
  final int tripId;
  final double totalPrice;
  final String paymentMethod;
  final List<PassengerEntity> passengers;

  CreateBookingParams({
    required this.userId,
    required this.tripId,
    required this.totalPrice,
    required this.paymentMethod,
    required this.passengers,
  });

  Map<String, dynamic> toJson() {
    return {
      'auth_id': userId,
      'trip_id': tripId,
      'total_price': totalPrice,
      'payment_method': paymentMethod,
      'passengers': passengers.map((p) => {
        'full_name': p.fullName,
        'id_number': p.idNumber,
        'seat_id': p.seatId,
        'gender': p.gender == 'M' ? 'male' : (p.gender == 'F' ? 'female' : null),
        'birth_date': p.birthDate,
        'phone_number': p.phoneNumber,
        'id_image': p.idPhoto,
      }).toList(),
    };
  }
}
