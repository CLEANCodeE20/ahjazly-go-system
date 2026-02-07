import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/trip_entity.dart';
import '../entities/rating_entity.dart';

abstract class TripsRepository {
  Future<Either<Failure, List<TripEntity>>> getTrips({
    required String cityFrom,
    required String cityTo,
    required String date,
    String? busClass,
  });

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
  });

  Future<Either<Failure, List<TripRatingEntity>>> getTripRatings({
    required int tripId,
    int limit = 10,
    int offset = 0,
  });

  Future<Either<Failure, PartnerRatingStatsEntity>> getPartnerStats(int partnerId);

  Future<Either<Failure, Map<String, dynamic>>> markRatingHelpful({
    required int ratingId,
    required bool isHelpful,
  });

  Future<Either<Failure, bool>> reportRating({
    required int ratingId,
    required String reason,
    String? description,
  });

  Future<Either<Failure, bool>> canUserRateTrip({
    required int userId,
    required int tripId,
    required int bookingId,
  });

  Future<Either<Failure, RatingEntity>> updateRating({
    required int ratingId,
    int? stars,
    int? serviceRating,
    int? cleanlinessRating,
    int? punctualityRating,
    int? comfortRating,
    int? valueForMoneyRating,
    String? comment,
  });

  Future<Either<Failure, bool>> addPartnerResponse({
    required int ratingId,
    required String responseText,
  });

  Future<Either<Failure, double>> getPartnerAverageRating(int partnerId);

  Future<Either<Failure, double>> getDriverAverageRating(int driverId);
}
