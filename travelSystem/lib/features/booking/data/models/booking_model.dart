import '../../domain/entities/passenger_entity.dart';
import '../../domain/entities/booking_entity.dart';


class BookingModel extends BookingEntity {
  const BookingModel({
    required super.userId,
    required super.fullName,
    required super.bookingId,
    required super.bookingStatus,
    required super.tripId,
    required super.departureTime,
    required super.arrivalTime,
    required super.originCity,
    required super.destinationCity,
    required super.busClass,
    required super.companyName,
    required super.basePrice,
    required super.paymentStatus,
    super.passengerName,
    super.passengerPhone,
    super.seatNumber,
    super.refundAmount,
    super.cancellationFee,
    super.partnerId,
    super.driverId,
    super.hasRating = false,
    super.passengers,
    super.expiresAt,
  });

  factory BookingModel.fromJson(Map<String, dynamic> json) {
    int _toInt(dynamic v) {
      if (v is int) return v;
      if (v is String) return int.tryParse(v) ?? 0;
      if (v is num) return v.toInt();
      return 0;
    }

    double _toDouble(dynamic v) {
      if (v is double) return v;
      if (v is int) return v.toDouble();
      if (v is String) return double.tryParse(v) ?? 0.0;
      if (v is num) return v.toDouble();
      return 0.0;
    }

    final passengersRaw = json['passengers'];
    List<PassengerEntity>? passengers;
    if (passengersRaw is List) {
      passengers = passengersRaw.map((p) => PassengerEntity(
        fullName: p['full_name'] as String? ?? '',
        idNumber: p['id_number'] as String? ?? '',
        seatId: p['seat_id'] != null ? _toInt(p['seat_id']) : null,
        gender: p['gender'] as String?,
        birthDate: p['birth_date'] as String?,
        phoneNumber: p['phone_number'] as String?,
        idPhoto: p['id_image'] as String?,
      )).toList();
    }

    return BookingModel(
      userId: json['auth_id']?.toString() ?? json['user_id']?.toString() ?? '',
      fullName: json['full_name'] as String? ?? '',
      bookingId: _toInt(json['booking_id']),
      bookingStatus: json['booking_status'] as String? ?? 'Pending',
      tripId: _toInt(json['trip_id']),
      departureTime: DateTime.parse(json['departure_time'] as String),
      arrivalTime: DateTime.parse(json['arrival_time'] as String),
      originCity: json['origin_city'] as String? ?? '',
      destinationCity: json['destination_city'] as String? ?? '',
      busClass: json['bus_class'] as String? ?? '',
      companyName: json['company_name'] as String? ?? '',
      basePrice: _toDouble(json['total_price'] ?? json['base_price']),
      paymentStatus: json['payment_status'] as String? ?? 'Unpaid',
      passengerName: json['passenger_name'] as String? ?? (passengers != null && passengers.isNotEmpty ? passengers.first.fullName : null),
      passengerPhone: json['passenger_phone'] as String? ?? (passengers != null && passengers.isNotEmpty ? passengers.first.phoneNumber : null),
      seatNumber: json['seat_number']?.toString() ?? (passengers != null && passengers.isNotEmpty ? passengers.first.seatId?.toString() : null),
      refundAmount: json['refund_amount'] != null ? _toDouble(json['refund_amount']) : null,
      cancellationFee: json['cancellation_fee'] != null ? _toDouble(json['cancellation_fee']) : null,
      partnerId: json['partner_id'] != null ? _toInt(json['partner_id']) : null,
      driverId: json['driver_id'] != null ? _toInt(json['driver_id']) : null,
      hasRating: json['has_rating'] == true,
      passengers: passengers,
      expiresAt: json['expires_at'] != null ? DateTime.parse(json['expires_at'] as String) : null,
    );
  }

  @override
  Map<String, dynamic> toJson() {
    return {
      'auth_id': userId,
      'full_name': fullName,
      'booking_id': bookingId,
      'booking_status': bookingStatus,
      'trip_id': tripId,
      'departure_time': departureTime.toIso8601String(),
      'arrival_time': arrivalTime.toIso8601String(),
      'origin_city': originCity,
      'destination_city': destinationCity,
      'bus_class': busClass,
      'company_name': companyName,
      'total_price': basePrice,
      'payment_status': paymentStatus,
      'passenger_name': passengerName,
      'passenger_phone': passengerPhone,
      'seat_number': seatNumber,
      'refund_amount': refundAmount,
      'cancellation_fee': cancellationFee,
      'partner_id': partnerId,
      'driver_id': driverId,
      'expires_at': expiresAt?.toIso8601String(),
      'passengers': passengers?.map((p) => {
        'full_name': p.fullName,
        'id_number': p.idNumber,
        'seat_id': p.seatId,
        'gender': p.gender,
        'birth_date': p.birthDate,
        'phone_number': p.phoneNumber,
        'id_image': p.idPhoto,
      }).toList(),
    };
  }
}
