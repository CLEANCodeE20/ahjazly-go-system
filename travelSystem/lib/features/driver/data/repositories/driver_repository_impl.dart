import 'package:dartz/dartz.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/network_info.dart';
import '../../domain/entities/driver_document_entity.dart';
import '../../domain/entities/driver_entity.dart';
import '../../domain/entities/driver_settings_entity.dart';
import '../../domain/entities/driver_stats_entity.dart';
import '../../domain/entities/driver_trip_entity.dart';
import '../../domain/entities/trip_passenger_entity.dart';
import '../../domain/repositories/driver_repository.dart';
import '../datasources/driver_remote_data_source.dart';


class DriverRepositoryImpl implements DriverRepository {
  final DriverRemoteDataSource remoteDataSource;
  final NetworkInfo networkInfo;

  DriverRepositoryImpl({
    required this.remoteDataSource,
    required this.networkInfo,
  });

  @override
  Future<Either<Failure, DriverEntity>> getDriverByAuthId(String authId) async {
    if (await networkInfo.isConnected) {
      try {
        final driver = await remoteDataSource.getDriverByAuthId(authId);
        return Right(driver);
      } on ServerException catch (e) {
        return Left(ServerFailure(e.message ?? 'Server error'));
      }
    } else {
      return const Left(OfflineFailure('No internet connection'));
    }
  }

  @override
  Future<Either<Failure, DriverSettingsEntity>> getDriverSettings(int driverId) async {
    if (await networkInfo.isConnected) {
      try {
        final settings = await remoteDataSource.getDriverSettings(driverId);
        return Right(settings);
      } on ServerException catch (e) {
        return Left(ServerFailure(e.message ?? 'Server error'));
      }
    } else {
      return const Left(OfflineFailure('No internet connection'));
    }
  }

  @override
  Future<Either<Failure, void>> updateDriverSettings(int driverId, Map<String, dynamic> settings) async {
    if (await networkInfo.isConnected) {
      try {
        await remoteDataSource.updateDriverSettings(driverId, settings);
        return const Right(null);
      } on ServerException catch (e) {
        return Left(ServerFailure(e.message ?? 'Server error'));
      }
    } else {
      return const Left(OfflineFailure('No internet connection'));
    }
  }

  @override
  Future<Either<Failure, List<DriverTripEntity>>> getDriverTrips({
    required DateTime startDate,
    required DateTime endDate,
    String? status,
  }) async {
    if (await networkInfo.isConnected) {
      try {
        final trips = await remoteDataSource.getDriverTrips(
          startDate: startDate,
          endDate: endDate,
          status: status,
        );
        return Right(trips);
      } on ServerException catch (e) {
        return Left(ServerFailure(e.message ?? 'Server error'));
      }
    } else {
      return const Left(OfflineFailure('No internet connection'));
    }
  }

  @override
  Future<Either<Failure, List<TripPassengerEntity>>> getTripPassengers(int tripId) async {
    if (await networkInfo.isConnected) {
      try {
        final passengers = await remoteDataSource.getTripPassengers(tripId);
        return Right(passengers);
      } on ServerException catch (e) {
        return Left(ServerFailure(e.message ?? 'Server error'));
      }
    } else {
      return const Left(OfflineFailure('No internet connection'));
    }
  }

  @override
  Future<Either<Failure, Map<String, dynamic>>> updateTripStatus({
    required int tripId,
    required String newStatus,
    double? locationLat,
    double? locationLng,
    String? notes,
  }) async {
    if (await networkInfo.isConnected) {
      try {
        final result = await remoteDataSource.updateTripStatus(
          tripId: tripId,
          newStatus: newStatus,
          locationLat: locationLat,
          locationLng: locationLng,
          notes: notes,
        );
        return Right(result);
      } on ServerException catch (e) {
        return Left(ServerFailure(e.message ?? 'Server error'));
      }
    } else {
      return const Left(OfflineFailure('No internet connection'));
    }
  }

  @override
  Future<Either<Failure, Map<String, dynamic>>> logPassengerBoarding({
    required int passengerId,
    required int tripId,
    String boardingMethod = 'manual',
    double? locationLat,
    double? locationLng,
    String? notes,
  }) async {
    if (await networkInfo.isConnected) {
      try {
        final result = await remoteDataSource.logPassengerBoarding(
          passengerId: passengerId,
          tripId: tripId,
          boardingMethod: boardingMethod,
          locationLat: locationLat,
          locationLng: locationLng,
          notes: notes,
        );
        return Right(result);
      } on ServerException catch (e) {
        return Left(ServerFailure(e.message ?? 'Server error'));
      }
    } else {
      return const Left(OfflineFailure('No internet connection'));
    }
  }

  @override
  Future<Either<Failure, DriverStatsEntity>> getDriverStats(int driverId) async {
    if (await networkInfo.isConnected) {
      try {
        final stats = await remoteDataSource.getDriverStats(driverId);
        return Right(stats);
      } on ServerException catch (e) {
        return Left(ServerFailure(e.message ?? 'Server error'));
      }
    } else {
      return const Left(OfflineFailure('No internet connection'));
    }
  }

  @override
  Future<Either<Failure, List<DriverDocumentEntity>>> getDriverDocuments(int driverId) async {
    if (await networkInfo.isConnected) {
      try {
        final documents = await remoteDataSource.getDriverDocuments(driverId);
        return Right(documents);
      } on ServerException catch (e) {
        return Left(ServerFailure(e.message ?? 'Server error'));
      }
    } else {
      return const Left(OfflineFailure('No internet connection'));
    }
  }

  @override
  Future<Either<Failure, DriverDocumentEntity>> uploadDocument({
    required int driverId,
    required String filePath,
    required String fileName,
    required String documentType,
    String? expiryDate,
  }) async {
    if (await networkInfo.isConnected) {
      try {
        final result = await remoteDataSource.uploadDocument(
          driverId: driverId,
          filePath: filePath,
          fileName: fileName,
          documentType: documentType,
          expiryDate: expiryDate,
        );
        return Right(result);
      } on ServerException catch (e) {
        return Left(ServerFailure(e.message ?? 'Server error'));
      }
    } else {
      return const Left(OfflineFailure('No internet connection'));
    }
  }
}
