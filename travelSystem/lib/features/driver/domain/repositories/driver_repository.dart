import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/driver_entity.dart';
import '../entities/driver_trip_entity.dart';
import '../entities/trip_passenger_entity.dart';
import '../entities/driver_settings_entity.dart';
import '../entities/driver_stats_entity.dart';
import '../entities/driver_document_entity.dart';

abstract class DriverRepository {
  Future<Either<Failure, DriverEntity>> getDriverByAuthId(String authId);
  
  Future<Either<Failure, DriverSettingsEntity>> getDriverSettings(int driverId);
  
  Future<Either<Failure, void>> updateDriverSettings(int driverId, Map<String, dynamic> settings);
  
  Future<Either<Failure, List<DriverTripEntity>>> getDriverTrips({
    required DateTime startDate,
    required DateTime endDate,
    String? status,
  });
  
  Future<Either<Failure, List<TripPassengerEntity>>> getTripPassengers(int tripId);
  
  Future<Either<Failure, Map<String, dynamic>>> updateTripStatus({
    required int tripId,
    required String newStatus,
    double? locationLat,
    double? locationLng,
    String? notes,
  });
  
  Future<Either<Failure, Map<String, dynamic>>> logPassengerBoarding({
    required int passengerId,
    required int tripId,
    String boardingMethod = 'manual',
    double? locationLat,
    double? locationLng,
    String? notes,
  });

  Future<Either<Failure, DriverStatsEntity>> getDriverStats(int driverId);

  Future<Either<Failure, List<DriverDocumentEntity>>> getDriverDocuments(int driverId);

  Future<Either<Failure, DriverDocumentEntity>> uploadDocument({
    required int driverId,
    required String filePath,
    required String fileName,
    required String documentType,
    String? expiryDate,
  });
}
