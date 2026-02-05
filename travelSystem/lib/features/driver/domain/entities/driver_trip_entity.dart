class DriverTripEntity {
  final int tripId;
  final int? routeId;
  final int? busId;
  final DateTime departureTime;
  final DateTime? arrivalTime;
  final String status;
  final double basePrice;
  final String? originCity;
  final String? destinationCity;
  final String? busLicensePlate;
  final int passengerCount;

  DriverTripEntity({
    required this.tripId,
    this.routeId,
    this.busId,
    required this.departureTime,
    this.arrivalTime,
    required this.status,
    required this.basePrice,
    this.originCity,
    this.destinationCity,
    this.busLicensePlate,
    required this.passengerCount,
  });

  bool get isToday {
    final now = DateTime.now();
    return departureTime.year == now.year &&
        departureTime.month == now.month &&
        departureTime.day == now.day;
  }

  bool get isUpcoming {
    return departureTime.isAfter(DateTime.now());
  }

  String get statusLabel {
    switch (status) {
      case 'scheduled':
        return 'مجدولة';
      case 'in_progress':
        return 'جارية';
      case 'completed':
        return 'مكتملة';
      case 'cancelled':
        return 'ملغاة';
      default:
        return status;
    }
  }
}
