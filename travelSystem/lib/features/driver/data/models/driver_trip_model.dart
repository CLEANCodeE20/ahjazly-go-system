

import '../../domain/entities/driver_trip_entity.dart';

class DriverTripModel extends DriverTripEntity {
  DriverTripModel({
    required super.tripId,
    super.routeId,
    super.busId,
    required super.departureTime,
    super.arrivalTime,
    required super.status,
    required super.basePrice,
    super.originCity,
    super.destinationCity,
    super.busLicensePlate,
    required super.passengerCount,
  });

  factory DriverTripModel.fromJson(Map<String, dynamic> json) {
    return DriverTripModel(
      tripId: json['trip_id'] as int,
      routeId: json['route_id'] as int?,
      busId: json['bus_id'] as int?,
      departureTime: DateTime.parse(json['departure_time']),
      arrivalTime: json['arrival_time'] != null
          ? DateTime.parse(json['arrival_time'])
          : null,
      status: json['status'] as String,
      basePrice: (json['base_price'] as num).toDouble(),
      originCity: json['origin_city'] as String?,
      destinationCity: json['destination_city'] as String?,
      busLicensePlate: json['bus_license_plate'] as String?,
      passengerCount: json['passenger_count'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'trip_id': tripId,
      'route_id': routeId,
      'bus_id': busId,
      'departure_time': departureTime.toIso8601String(),
      'arrival_time': arrivalTime?.toIso8601String(),
      'status': status,
      'base_price': basePrice,
      'origin_city': originCity,
      'destination_city': destinationCity,
      'bus_license_plate': busLicensePlate,
      'passenger_count': passengerCount,
    };
  }
}
