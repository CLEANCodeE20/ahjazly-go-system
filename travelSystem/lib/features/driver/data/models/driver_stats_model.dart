

import '../../domain/entities/driver_stats_entity.dart';

class DriverStatsModel extends DriverStatsEntity {
  DriverStatsModel({
    required super.totalTrips,
    required super.completedTrips,
    required super.totalPassengers,
  });

  factory DriverStatsModel.fromJson(Map<String, dynamic> json) {
    return DriverStatsModel(
      totalTrips: json['total_trips'] as int? ?? 0,
      completedTrips: json['completed_trips'] as int? ?? 0,
      totalPassengers: json['total_passengers'] as int? ?? 0,
    );
  }
}
