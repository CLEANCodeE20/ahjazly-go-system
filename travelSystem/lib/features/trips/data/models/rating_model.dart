import '../../domain/entities/rating_entity.dart';

class RatingModel extends RatingEntity {
  const RatingModel({
    required super.ratingId,
    required super.userId,
    required super.tripId,
    required super.bookingId,
    super.driverId,
    required super.partnerId,
    required super.stars,
    super.serviceRating,
    super.cleanlinessRating,
    super.punctualityRating,
    super.comfortRating,
    super.valueForMoneyRating,
    super.comment,
    required super.isVerified,
    required super.isVisible,
    super.adminNotes,
    required super.helpfulCount,
    required super.notHelpfulCount,
    required super.reportedCount,
    required super.ratingDate,
    required super.updatedAt,
  });

  factory RatingModel.fromJson(Map<String, dynamic> json) {
    return RatingModel(
      ratingId: json['rating_id'] as int,
      userId: json['user_id'] is int ? json['user_id'] as int : 0, // Handle potentially UUID if needed, but RPC returns int ID
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
