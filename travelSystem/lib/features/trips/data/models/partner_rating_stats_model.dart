import '../../domain/entities/rating_entity.dart';

class PartnerRatingStatsModel extends PartnerRatingStatsEntity {
  const PartnerRatingStatsModel({
    required super.partnerId,
    required super.companyName,
    required super.totalRatings,
    required super.avgOverallRating,
    super.avgServiceRating,
    super.avgCleanlinessRating,
    super.avgPunctualityRating,
    super.avgComfortRating,
    super.avgValueRating,
    required super.fiveStarCount,
    required super.fourStarCount,
    required super.threeStarCount,
    required super.twoStarCount,
    required super.oneStarCount,
    required super.positiveRatings,
    required super.negativeRatings,
    required super.positivePercentage,
    required super.negativePercentage,
  });

  factory PartnerRatingStatsModel.fromJson(Map<String, dynamic> json) {
    return PartnerRatingStatsModel(
      partnerId: json['partner_id'] as int,
      companyName: json['company_name'] as String? ?? '',
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
