class UserBooking {
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

  final List<UserBookingPassenger>? passengers;

  UserBooking({
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
  });

  factory UserBooking.fromJson(Map<String, dynamic> json) {
    // helpers لتحويل int/String إلى int
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

    double? _toDoubleNullable(dynamic v) {
      if (v == null) return null;
      return _toDouble(v);
    }

    final passengersRaw = json['passengers'];
    List<UserBookingPassenger>? passengers;
    if (passengersRaw is List) {
      passengers = passengersRaw.map((p) => UserBookingPassenger(
        fullName: p['full_name'] as String? ?? '',
        phoneNumber: p['phone_number'] as String?,
        seatNumber: p['seat_number']?.toString(),
        idNumber: p['id_number'] as String?,
        gender: p['gender'] as String?,
        birthDate: p['birth_date'] as String?,
        idImage: p['id_image'] as String?,
      )).toList();
    }

    return UserBooking(
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
      seatNumber: json['seat_number']?.toString() ?? (passengers != null && passengers.isNotEmpty ? passengers.first.seatNumber : null),
      refundAmount: _toDoubleNullable(json['refund_amount']),
      cancellationFee: _toDoubleNullable(json['cancellation_fee']),
      partnerId: json['partner_id'] != null ? _toInt(json['partner_id']) : null,
      driverId: json['driver_id'] != null ? _toInt(json['driver_id']) : null,
      hasRating: json['ratings'] != null && (json['ratings'] is List ? (json['ratings'] as List).isNotEmpty : true),
      paymentMethod: json['payment_method'] as String?,
      passengers: passengers,
    );
  }
}

class UserBookingPassenger {
  final String fullName;
  final String? phoneNumber;
  final String? seatNumber;
  final String? idNumber;
  final String? gender;
  final String? birthDate;
  final String? idImage;

  UserBookingPassenger({
    required this.fullName,
    this.phoneNumber,
    this.seatNumber,
    this.idNumber,
    this.gender,
    this.birthDate,
    this.idImage,
  });
}
