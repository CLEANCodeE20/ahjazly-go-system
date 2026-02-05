import 'passenger_entity.dart';

class BookingEntity {
  final String userId;
  final String fullName;
  final int bookingId;
  final String bookingStatus;
  final int tripId;
  final DateTime departureTime;
  final DateTime arrivalTime;
  final String originCity;
  final String destinationCity;
  final String busClass;
  final String companyName;
  final double basePrice;
  final String paymentStatus;
  final String? passengerName;
  final String? passengerPhone;
  final String? seatNumber;
  final double? refundAmount;
  final double? cancellationFee;
  final int? partnerId;
  final int? driverId;
  final bool hasRating;
  final String? paymentMethod;
  final List<PassengerEntity>? passengers;
  final DateTime? expiresAt;

  const BookingEntity({
    required this.userId,
    required this.fullName,
    required this.bookingId,
    required this.bookingStatus,
    required this.tripId,
    required this.departureTime,
    required this.arrivalTime,
    required this.originCity,
    required this.destinationCity,
    required this.busClass,
    required this.companyName,
    required this.basePrice,
    required this.paymentStatus,
    this.passengerName,
    this.passengerPhone,
    this.seatNumber,
    this.refundAmount,
    this.cancellationFee,
    this.partnerId,
    this.driverId,
    this.hasRating = false,
    this.paymentMethod,
    this.passengers,
    this.expiresAt,
  });
}
