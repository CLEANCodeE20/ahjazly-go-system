// =============================================
// RATING MODEL
// نموذج التقييم
// =============================================

class Rating {
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

  Rating({
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

  factory Rating.fromJson(Map<String, dynamic> json) {
    return Rating(
      ratingId: json['rating_id'] as int,
      userId: json['user_id'] as int,
      tripId: json['trip_id'] as int,
      bookingId: json['booking_id'] as int,
      driverId: json['driver_id'] as int?,
      partnerId: json['partner_id'] as int,
      stars: json['stars'] as int,
      serviceRating: json['service_rating'] as int?,
      cleanlinessRating: json['cleanliness_rating'] as int?,
      punctualityRating: json['punctuality_rating'] as int?,
      comfortRating: json['comfort_rating'] as int?,
      valueForMoneyRating: json['value_for_money_rating'] as int?,
      comment: json['comment'] as String?,
      isVerified: json['is_verified'] as bool? ?? false,
      isVisible: json['is_visible'] as bool? ?? true,
      adminNotes: json['admin_notes'] as String?,
      helpfulCount: json['helpful_count'] as int? ?? 0,
      notHelpfulCount: json['not_helpful_count'] as int? ?? 0,
      reportedCount: json['reported_count'] as int? ?? 0,
      ratingDate: DateTime.parse(json['rating_date'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'rating_id': ratingId,
      'user_id': userId,
      'trip_id': tripId,
      'booking_id': bookingId,
      'driver_id': driverId,
      'partner_id': partnerId,
      'stars': stars,
      'service_rating': serviceRating,
      'cleanliness_rating': cleanlinessRating,
      'punctuality_rating': punctualityRating,
      'comfort_rating': comfortRating,
      'value_for_money_rating': valueForMoneyRating,
      'comment': comment,
      'is_verified': isVerified,
      'is_visible': isVisible,
      'admin_notes': adminNotes,
      'helpful_count': helpfulCount,
      'not_helpful_count': notHelpfulCount,
      'reported_count': reportedCount,
      'rating_date': ratingDate.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }
}

// =============================================
// TRIP RATING MODEL (للعرض)
// =============================================

class TripRating {
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

  TripRating({
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

  factory TripRating.fromJson(Map<String, dynamic> json) {
    return TripRating(
      ratingId: json['rating_id'] as int,
      userName: json['user_name'] as String,
      stars: json['stars'] as int,
      serviceRating: json['service_rating'] as int?,
      cleanlinessRating: json['cleanliness_rating'] as int?,
      punctualityRating: json['punctuality_rating'] as int?,
      comfortRating: json['comfort_rating'] as int?,
      valueForMoneyRating: json['value_for_money_rating'] as int?,
      comment: json['comment'] as String?,
      ratingDate: DateTime.parse(json['rating_date'] as String),
      helpfulCount: json['helpful_count'] as int? ?? 0,
      notHelpfulCount: json['not_helpful_count'] as int? ?? 0,
      hasResponse: json['has_response'] as bool? ?? false,
      responseText: json['response_text'] as String?,
      responseDate: json['response_date'] != null
          ? DateTime.parse(json['response_date'] as String)
          : null,
    );
  }
}

// =============================================
// CREATE RATING INPUT
// =============================================

class CreateRatingInput {
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

  CreateRatingInput({
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
  });

  Map<String, dynamic> toJson() {
    return {
      'trip_id': tripId,
      'booking_id': bookingId,
      'driver_id': driverId,
      'partner_id': partnerId,
      'stars': stars,
      'service_rating': serviceRating,
      'cleanliness_rating': cleanlinessRating,
      'punctuality_rating': punctualityRating,
      'comfort_rating': comfortRating,
      'value_for_money_rating': valueForMoneyRating,
      'comment': comment,
    };
  }
}

// =============================================
// PARTNER RATING STATS
// =============================================

class PartnerRatingStats {
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

  PartnerRatingStats({
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

  factory PartnerRatingStats.fromJson(Map<String, dynamic> json) {
    return PartnerRatingStats(
      partnerId: json['partner_id'] as int,
      companyName: json['company_name'] as String,
      totalRatings: json['total_ratings'] as int? ?? 0,
      avgOverallRating: (json['avg_overall'] as num?)?.toDouble() ?? 0.0,
      avgServiceRating: (json['avg_service'] as num?)?.toDouble(),
      avgCleanlinessRating: (json['avg_cleanliness'] as num?)?.toDouble(),
      avgPunctualityRating: (json['avg_punctuality'] as num?)?.toDouble(),
      avgComfortRating: (json['avg_comfort'] as num?)?.toDouble(),
      avgValueRating: (json['avg_value'] as num?)?.toDouble(),
      fiveStarCount: json['five_star_count'] as int? ?? 0,
      fourStarCount: json['four_star_count'] as int? ?? 0,
      threeStarCount: json['three_star_count'] as int? ?? 0,
      twoStarCount: json['two_star_count'] as int? ?? 0,
      oneStarCount: json['one_star_count'] as int? ?? 0,
      positiveRatings: json['positive_ratings'] as int? ?? 0,
      negativeRatings: json['negative_ratings'] as int? ?? 0,
      positivePercentage: (json['positive_percentage'] as num?)?.toDouble() ?? 0.0,
      negativePercentage: (json['negative_percentage'] as num?)?.toDouble() ?? 0.0,
    );
  }
}
