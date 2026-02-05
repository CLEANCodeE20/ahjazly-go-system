import 'package:intl/intl.dart';
import '../../domain/entities/trip_entity.dart';

class BusTripModel extends TripEntity {
  const BusTripModel({
    required super.tripType,
    required super.cityFrom,
    required super.timeFrom,
    required super.dateFrom,
    required super.cityTo,
    required super.timeTo,
    required super.dateTo,
    required super.duration,
    required super.tripNumber,
    required super.availableSeats,
    required super.priceAdult,
    required super.priceChild,
    required super.isVIP,
    required super.companyName,
    required super.busId,
    required super.seatLayout,
    super.linkedTripId,
  });

  factory BusTripModel.fromJson(Map<String, dynamic> json) {
    DateTime dep = DateTime.tryParse(json['departure_time']?.toString() ?? '') ?? DateTime.now();
    DateTime arr = DateTime.tryParse(json['arrival_time']?.toString() ?? '') ?? DateTime.now();

    String duration = "${arr.difference(dep).inHours} ساعات, ${arr.difference(dep).inMinutes % 60} دقائق";

    final timeFormatter = DateFormat('HH:mm');
    final dateFormatter = DateFormat('yyyy-MM-dd');

    return BusTripModel(
      tripType: json['bus_class']?.toString() ?? "",
      cityFrom: json['route_from_stop']?.toString() ?? "",
      timeFrom: timeFormatter.format(dep),
      dateFrom: dateFormatter.format(dep),
      cityTo: json['destination_city']?.toString() ?? "",
      timeTo: timeFormatter.format(arr),
      dateTo: dateFormatter.format(arr),
      duration: duration,
      tripNumber: int.tryParse(json['trip_id']?.toString() ?? '0') ?? 0,
      availableSeats: int.tryParse(json['available_seats']?.toString() ?? '0') ?? 0,
      priceAdult: double.tryParse(json['price_adult']?.toString() ?? '0')?.toInt() ?? 0,
      priceChild: double.tryParse(json['price_child']?.toString() ?? '0')?.toInt() ?? 0,
      isVIP: (json['bus_class']?.toString() ?? '') == 'VIP',
      companyName: json['company_name']?.toString() ?? "",
      busId: int.tryParse(json['trip_bus_id']?.toString() ?? '0') ?? 0,
      seatLayout: json['seat_layout'] is Map<String, dynamic> ? json['seat_layout'] : {},
      linkedTripId: json['linked_trip_id'] != null ? int.tryParse(json['linked_trip_id'].toString()) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'bus_class': tripType,
      'route_from_stop': cityFrom,
      'destination_city': cityTo,
      'trip_id': tripNumber,
      'available_seats': availableSeats,
      'price_adult': priceAdult,
      'price_child': priceChild,
      'company_name': companyName,
      'trip_bus_id': busId,
      'seat_layout': seatLayout,
      'linked_trip_id': linkedTripId,
    };
  }
}
