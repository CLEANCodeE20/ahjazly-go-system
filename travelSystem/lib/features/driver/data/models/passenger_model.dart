class PassengerModel {
  final int passengerId;
  final int? bookingId;
  final int? tripId;
  final int? seatId;
  final String fullName;
  final String? phoneNumber;
  final String? passengerStatus;
  final bool isBoarded;

  PassengerModel({
    required this.passengerId,
    this.bookingId,
    this.tripId,
    this.seatId,
    required this.fullName,
    this.phoneNumber,
    this.passengerStatus,
    this.isBoarded = false,
  });

  factory PassengerModel.fromJson(Map<String, dynamic> json) {
    return PassengerModel(
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

  PassengerModel copyWith({
    bool? isBoarded,
    String? passengerStatus,
  }) {
    return PassengerModel(
      passengerId: passengerId,
      bookingId: bookingId,
      tripId: tripId,
      seatId: seatId,
      fullName: fullName,
      phoneNumber: phoneNumber,
      passengerStatus: passengerStatus ?? this.passengerStatus,
      isBoarded: isBoarded ?? this.isBoarded,
    );
  }
}
