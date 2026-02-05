import '../../domain/entities/rating_entity.dart';

class TripRatingModel extends TripRatingEntity {
  const TripRatingModel({
    required super.ratingId,
    required super.userName,
    required super.stars,
    super.serviceRating,
    super.cleanlinessRating,
    super.punctualityRating,
    super.comfortRating,
    super.valueForMoneyRating,
    super.comment,
    required super.ratingDate,
    required super.helpfulCount,
    required super.notHelpfulCount,
    required super.hasResponse,
    super.responseText,
    super.responseDate,
  });

  factory TripRatingModel.fromJson(Map<String, dynamic> json) {
    return TripRatingModel(
      ratingId: json['rating_id'] as int,
      userName: json['user_name'] as String? ?? 'User',
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
