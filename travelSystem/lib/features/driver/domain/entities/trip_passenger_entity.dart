class TripPassengerEntity {
  final int passengerId;
  final int? bookingId;
  final int? tripId;
  final int? seatId;
  final String fullName;
  final String? phoneNumber;
  final String? passengerStatus;
  final bool isBoarded;

  TripPassengerEntity({
    required this.passengerId,
    this.bookingId,
    this.tripId,
    this.seatId,
    required this.fullName,
    this.phoneNumber,
    this.passengerStatus,
    this.isBoarded = false,
  });

  TripPassengerEntity copyWith({
    bool? isBoarded,
    String? passengerStatus,
  }) {
    return TripPassengerEntity(
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
