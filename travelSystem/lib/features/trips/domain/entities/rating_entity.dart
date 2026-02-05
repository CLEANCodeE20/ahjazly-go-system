import 'package:equatable/equatable.dart';

class RatingEntity extends Equatable {
  final int ratingId;
  final int userId;
  final int tripId;
  final int bookingId;
  final int? driverId;
  final int partnerId;
  final int stars;
  final int? serviceRating;
  final int? cleanlinessRating;
  final int? punctualityRating;
  final int? comfortRating;
  final int? valueForMoneyRating;
  final String? comment;
  final bool isVerified;
  final bool isVisible;
  final String? adminNotes;
  final int helpfulCount;
  final int notHelpfulCount;
  final int reportedCount;
  final DateTime ratingDate;
  final DateTime updatedAt;

  const RatingEntity({
    required this.ratingId,
    required this.userId,
    required this.tripId,
    required this.bookingId,
    this.driverId,
    required this.partnerId,
    required this.stars,
    this.serviceRating,
    this.cleanlinessRating,
    this.punctualityRating,
    this.comfortRating,
    this.valueForMoneyRating,
    this.comment,
    required this.isVerified,
    required this.isVisible,
    this.adminNotes,
    required this.helpfulCount,
    required this.notHelpfulCount,
    required this.reportedCount,
    required this.ratingDate,
    required this.updatedAt,
  });

  @override
  List<Object?> get props => [
        ratingId,
        userId,
        tripId,
        bookingId,
        driverId,
        partnerId,
        stars,
        serviceRating,
        cleanlinessRating,
        punctualityRating,
        comfortRating,
        valueForMoneyRating,
        comment,
        isVerified,
        isVisible,
        adminNotes,
        helpfulCount,
        notHelpfulCount,
        reportedCount,
        ratingDate,
        updatedAt,
      ];
}

class TripRatingEntity extends Equatable {
  final int ratingId;
  final String userName;
  final int stars;
  final int? serviceRating;
  final int? cleanlinessRating;
  final int? punctualityRating;
  final int? comfortRating;
  final int? valueForMoneyRating;
  final String? comment;
  final DateTime ratingDate;
  final int helpfulCount;
  final int notHelpfulCount;
  final bool hasResponse;
  final String? responseText;
  final DateTime? responseDate;

  const TripRatingEntity({
    required this.ratingId,
    required this.userName,
    required this.stars,
    this.serviceRating,
    this.cleanlinessRating,
    this.punctualityRating,
    this.comfortRating,
    this.valueForMoneyRating,
    this.comment,
    required this.ratingDate,
    required this.helpfulCount,
    required this.notHelpfulCount,
    required this.hasResponse,
    this.responseText,
    this.responseDate,
  });

  @override
  List<Object?> get props => [
        ratingId,
        userName,
        stars,
        serviceRating,
        cleanlinessRating,
        punctualityRating,
        comfortRating,
        valueForMoneyRating,
        comment,
        ratingDate,
        helpfulCount,
        notHelpfulCount,
        hasResponse,
        responseText,
        responseDate,
      ];
}

class PartnerRatingStatsEntity extends Equatable {
  final int partnerId;
  final String companyName;
  final int totalRatings;
  final double avgOverallRating;
  final double? avgServiceRating;
  final double? avgCleanlinessRating;
  final double? avgPunctualityRating;
  final double? avgComfortRating;
  final double? avgValueRating;
  final int fiveStarCount;
  final int fourStarCount;
  final int threeStarCount;
  final int twoStarCount;
  final int oneStarCount;
  final int positiveRatings;
  final int negativeRatings;
  final double positivePercentage;
  final double negativePercentage;

  const PartnerRatingStatsEntity({
    required this.partnerId,
    required this.companyName,
    required this.totalRatings,
    required this.avgOverallRating,
    this.avgServiceRating,
    this.avgCleanlinessRating,
    this.avgPunctualityRating,
    this.avgComfortRating,
    this.avgValueRating,
    required this.fiveStarCount,
    required this.fourStarCount,
    required this.threeStarCount,
    required this.twoStarCount,
    required this.oneStarCount,
    required this.positiveRatings,
    required this.negativeRatings,
    required this.positivePercentage,
    required this.negativePercentage,
  });

  @override
  List<Object?> get props => [
        partnerId,
        companyName,
        totalRatings,
        avgOverallRating,
        avgServiceRating,
        avgCleanlinessRating,
        avgPunctualityRating,
        avgComfortRating,
        avgValueRating,
        fiveStarCount,
        fourStarCount,
        threeStarCount,
        twoStarCount,
        oneStarCount,
        positiveRatings,
        negativeRatings,
        positivePercentage,
        negativePercentage,
      ];
}
