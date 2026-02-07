import 'package:dartz/dartz.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/network_info.dart';
import '../../domain/entities/trip_entity.dart';
import '../../domain/entities/rating_entity.dart';
import '../../domain/repositories/trips_repository.dart';
import '../datasources/trips_remote_data_source.dart';

import '../models/rating_model.dart';
import '../models/trip_rating_model.dart';
import '../models/partner_rating_stats_model.dart';

class TripsRepositoryImpl implements TripsRepository {
  final TripsRemoteDataSource remoteDataSource;
  final NetworkInfo networkInfo;

  TripsRepositoryImpl({
    required this.remoteDataSource,
    required this.networkInfo,
  });

  @override
  Future<Either<Failure, List<TripEntity>>> getTrips({
    required String cityFrom,
    required String cityTo,
    required String date,
    String? busClass,
  }) async {
    if (await networkInfo.isConnected) {
      try {
        final trips = await remoteDataSource.searchTrips(
          fromCity: cityFrom,
          toCity: cityTo,
          date: date,
          busClass: busClass,
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
  Future<Either<Failure, RatingEntity>> submitRating({
    required int tripId,
    required int bookingId,
    required int partnerId,
    int? driverId,
    required int stars,
    int? serviceRating,
    int? cleanlinessRating,
    int? punctualityRating,
    int? comfortRating,
    int? valueForMoneyRating,
    String? comment,
  }) async {
    if (await networkInfo.isConnected) {
      try {
        final result = await remoteDataSource.submitRating(
          tripId: tripId,
          bookingId: bookingId,
          partnerId: partnerId,
          driverId: driverId,
          stars: stars,
          serviceRating: serviceRating,
          cleanlinessRating: cleanlinessRating,
          punctualityRating: punctualityRating,
          comfortRating: comfortRating,
          valueForMoneyRating: valueForMoneyRating,
          comment: comment,
        );
        return Right(RatingModel.fromJson(result));
      } on ServerException catch (e) {
        return Left(ServerFailure(e.message ?? 'Server error'));
      }
    } else {
      return const Left(OfflineFailure('No internet connection'));
    }
  }

  @override
  Future<Either<Failure, List<TripRatingEntity>>> getTripRatings({
    required int tripId,
    int limit = 10,
    int offset = 0,
  }) async {
    if (await networkInfo.isConnected) {
      try {
        final results = await remoteDataSource.getTripRatings(
          tripId: tripId,
          limit: limit,
          offset: offset,
        );
        return Right(results.map((json) => TripRatingModel.fromJson(json)).toList());
      } on ServerException catch (e) {
        return Left(ServerFailure(e.message ?? 'Server error'));
      }
    } else {
      return const Left(OfflineFailure('No internet connection'));
    }
  }

  @override
  Future<Either<Failure, PartnerRatingStatsEntity>> getPartnerStats(int partnerId) async {
    if (await networkInfo.isConnected) {
      try {
        final result = await remoteDataSource.getPartnerStats(partnerId);
        if (result == null) return Left(ServerFailure('No stats found'));
        return Right(PartnerRatingStatsModel.fromJson(result));
      } on ServerException catch (e) {
        return Left(ServerFailure(e.message ?? 'Server error'));
      }
    } else {
      return const Left(OfflineFailure('No internet connection'));
    }
  }

  @override
  Future<Either<Failure, Map<String, dynamic>>> markRatingHelpful({
    required int ratingId,
    required bool isHelpful,
  }) async {
    if (await networkInfo.isConnected) {
      try {
        final result = await remoteDataSource.markRatingHelpful(
          ratingId: ratingId,
          isHelpful: isHelpful,
        );
        if (result == null) return Left(ServerFailure('Operation failed'));
        return Right(result);
      } on ServerException catch (e) {
        return Left(ServerFailure(e.message ?? 'Server error'));
      }
    } else {
      return const Left(OfflineFailure('No internet connection'));
    }
  }

  @override
  Future<Either<Failure, bool>> reportRating({
    required int ratingId,
    required String reason,
    String? description,
  }) async {
    if (await networkInfo.isConnected) {
      try {
        final success = await remoteDataSource.reportRating(
          ratingId: ratingId,
          reason: reason,
          description: description,
        );
        return Right(success);
      } on ServerException catch (e) {
        return Left(ServerFailure(e.message ?? 'Server error'));
      }
    } else {
      return const Left(OfflineFailure('No internet connection'));
    }
  }

  @override
  Future<Either<Failure, bool>> canUserRateTrip({
    required int userId,
    required int tripId,
    required int bookingId,
  }) async {
    if (await networkInfo.isConnected) {
      try {
        final result = await remoteDataSource.canUserRateTrip(
          userId: userId,
          tripId: tripId,
          bookingId: bookingId,
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
  Future<Either<Failure, RatingEntity>> updateRating({
    required int ratingId,
    int? stars,
    int? serviceRating,
    int? cleanlinessRating,
    int? punctualityRating,
    int? comfortRating,
    int? valueForMoneyRating,
    String? comment,
  }) async {
    if (await networkInfo.isConnected) {
      try {
        final result = await remoteDataSource.updateRating(
          ratingId: ratingId,
          stars: stars,
          serviceRating: serviceRating,
          cleanlinessRating: cleanlinessRating,
          punctualityRating: punctualityRating,
          comfortRating: comfortRating,
          valueForMoneyRating: valueForMoneyRating,
          comment: comment,
        );
        return Right(RatingModel.fromJson(result));
      } on ServerException catch (e) {
        return Left(ServerFailure(e.message ?? 'Server error'));
      }
    } else {
      return const Left(OfflineFailure('No internet connection'));
    }
  }

  @override
  Future<Either<Failure, bool>> addPartnerResponse({
    required int ratingId,
    required String responseText,
  }) async {
    if (await networkInfo.isConnected) {
      try {
        final result = await remoteDataSource.addPartnerResponse(
          ratingId: ratingId,
          responseText: responseText,
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
  Future<Either<Failure, double>> getPartnerAverageRating(int partnerId) async {
    if (await networkInfo.isConnected) {
      try {
        final result = await remoteDataSource.getPartnerAverageRating(partnerId);
        return Right(result);
      } on ServerException catch (e) {
        return Left(ServerFailure(e.message ?? 'Server error'));
      }
    } else {
      return const Left(OfflineFailure('No internet connection'));
    }
  }

  @override
  Future<Either<Failure, double>> getDriverAverageRating(int driverId) async {
    if (await networkInfo.isConnected) {
      try {
        final result = await remoteDataSource.getDriverAverageRating(driverId);
        return Right(result);
      } on ServerException catch (e) {
        return Left(ServerFailure(e.message ?? 'Server error'));
      }
    } else {
      return const Left(OfflineFailure('No internet connection'));
    }
  }
}
