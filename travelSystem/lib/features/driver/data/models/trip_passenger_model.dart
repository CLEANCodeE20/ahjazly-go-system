

import '../../domain/entities/trip_passenger_entity.dart';

class TripPassengerModel extends TripPassengerEntity {
  TripPassengerModel({
    required super.passengerId,
    super.bookingId,
    super.tripId,
    super.seatId,
    required super.fullName,
    super.phoneNumber,
    super.passengerStatus,
    super.isBoarded,
  });

  factory TripPassengerModel.fromJson(Map<String, dynamic> json) {
    return TripPassengerModel(
      passengerId: json['passenger_id'] as int,
      bookingId: json['booking_id'] as int?,
      tripId: json['trip_id'] as int?,
      seatId: json['seat_id'] as int?,
      fullName: json['full_name'] as String,
      phoneNumber: json['phone_number'] as String?,
      passengerStatus: json['passenger_status'] as String?,
      isBoarded: json['passenger_status'] == 'boarded',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'passenger_id': passengerId,
      'booking_id': bookingId,
      'trip_id': tripId,
      'seat_id': seatId,
      'full_name': fullName,
      'phone_number': phoneNumber,
      'passenger_status': passengerStatus,
    };
  }
}
